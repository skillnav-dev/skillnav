-- Update source check constraint to support new discovery sources
ALTER TABLE skills DROP CONSTRAINT skills_source_check;
ALTER TABLE skills ADD CONSTRAINT skills_source_check
  CHECK (source IN (
    'clawhub', 'skills_sh', 'skills-sh', 'anthropic',
    'skillsmp', 'agentskill', 'manual', 'curated',
    'awesome-list', 'openclaw'
  ));
