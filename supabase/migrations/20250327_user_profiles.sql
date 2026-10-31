-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    auth_id UUID PRIMARY KEY REFERENCES auth.users(id),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    education TEXT,
    employment_status TEXT,
    monthly_income NUMERIC,
    account_balance DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create loan_applications table
CREATE TABLE public.loan_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(auth_id) ON DELETE CASCADE NOT NULL,
    loan_amount NUMERIC NOT NULL,
    loan_purpose TEXT,
    repayment_period INTEGER,
    savings_fee NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create loan_repayments table
CREATE TABLE public.loan_repayments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    loan_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can view own loans"
    ON public.loan_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create loans"
    ON public.loan_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own repayments"
    ON public.loan_repayments FOR SELECT
    USING (auth.uid() = (
        SELECT user_id FROM public.loan_applications 
        WHERE id = loan_repayments.loan_id
    ));

CREATE POLICY "Users can create repayments"
    ON public.loan_repayments FOR INSERT
    WITH CHECK (auth.uid() = (
        SELECT user_id FROM public.loan_applications 
        WHERE id = loan_id
    ));

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (auth_id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
