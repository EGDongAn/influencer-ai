-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 인플루언서 임베딩 테이블
CREATE TABLE IF NOT EXISTS influencer.influencer_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id TEXT NOT NULL UNIQUE,
  embedding vector(768),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시술 임베딩 테이블
CREATE TABLE IF NOT EXISTS influencer.treatment_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id TEXT NOT NULL UNIQUE,
  embedding vector(768),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 콘텐츠 임베딩 테이블
CREATE TABLE IF NOT EXISTS influencer.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL UNIQUE,
  embedding vector(768),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (IVFFlat - 빠른 검색용)
CREATE INDEX IF NOT EXISTS influencer_embeddings_idx
ON influencer.influencer_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS treatment_embeddings_idx
ON influencer.treatment_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS content_embeddings_idx
ON influencer.content_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 인플루언서 매칭 함수
CREATE OR REPLACE FUNCTION influencer.match_influencers(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  influencer_id TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ie.influencer_id,
    ie.content,
    1 - (ie.embedding <=> query_embedding) AS similarity
  FROM influencer.influencer_embeddings ie
  WHERE 1 - (ie.embedding <=> query_embedding) > match_threshold
  ORDER BY ie.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 시술 매칭 함수
CREATE OR REPLACE FUNCTION influencer.match_treatments(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.6,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  treatment_id TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.treatment_id,
    te.content,
    1 - (te.embedding <=> query_embedding) AS similarity
  FROM influencer.treatment_embeddings te
  WHERE 1 - (te.embedding <=> query_embedding) > match_threshold
  ORDER BY te.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 콘텐츠 매칭 함수
CREATE OR REPLACE FUNCTION influencer.match_contents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  content_id TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.content_id,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM influencer.content_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS 정책 (필요시)
-- ALTER TABLE influencer.influencer_embeddings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE influencer.treatment_embeddings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE influencer.content_embeddings ENABLE ROW LEVEL SECURITY;
