-- Executar após o teste (ajuste o padrão de email se necessário).
-- Remove votos e utilizadores criados para carga; opcionalmente o candidato de teste.

-- Votos de utilizadores de load test
DELETE FROM votes
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@voxscore.loadtest'
);

-- Utilizadores de load test
DELETE FROM users WHERE email LIKE '%@voxscore.loadtest';

-- Candidato de teste (descomente e substitua o UUID se usou prepare-candidate.mjs)
-- DELETE FROM candidates WHERE id = '00000000-0000-0000-0000-000000000000';
