-- Extensión oficial de Postgres para crear IDs aleatorios y únicos
create extension if not exists "uuid-ossp";

-- Tabla principal de Importación de CSV (Trabajos)
create table public.import_jobs (
    id uuid primary key default uuid_generate_v4(),
    filename text not null,
    total_rows integer not null default 0,
    valid_count integer not null default 0,
    error_count integer not null default 0,
    status text not null check (status in ('uploading', 'validated', 'partial_error', 'failed', 'completed')),
    
    -- Los datos que escaneamos del CSV se guardan aquí procesados
    raw_data jsonb default '[]'::jsonb,
    validation_result jsonb default '{}'::jsonb,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla para rastrear qué se envía al Ministerio (Lotes)
create table public.communication_batches (
    id uuid primary key default uuid_generate_v4(),
    import_job_id uuid references public.import_jobs(id) on delete cascade not null,
    type text not null check (type in ('reserva_hospedaje', 'parte_viajeros')),
    status text not null check (status in ('pending', 'processing', 'accepted', 'rejected', 'error')),
    
    ses_batch_id text,
    item_count integer not null default 0,
    accepted_count integer not null default 0,
    rejected_count integer not null default 0,
    xml_hash text,
    
    -- Respuesta pura en texto/JSON del servidor SES para propósitos de auditoría
    api_response jsonb default '{}'::jsonb,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
