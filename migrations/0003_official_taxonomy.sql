ALTER TABLE questions ADD COLUMN subject_code TEXT;
ALTER TABLE questions ADD COLUMN section TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_subject_code ON questions(subject_code);
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section);
