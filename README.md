# VoxScore

Resumo das funcionalidades — **Megadance 2026**.

## 1. Autenticação

- Login obrigatório com Google (simulado)
- Controle de sessão com logout
- Menu de usuário com foto e informações

## 2. Três perfis de acesso

### Administrador

- Controle de abertura/fechamento de votação por candidato
- Visualização do ranking em tempo real
- Indicadores visuais (verde = aberta, vermelho = fechada)

### Jurado

Avaliação por **5 critérios técnicos**:

- Técnica Vocal
- Interpretação
- Presença de Palco
- Originalidade
- Composição

- Notas de 1 a 10 estrelas por critério
- Pode avaliar múltiplos candidatos

### Público

Avaliação por **4 critérios de preferência**:

- Entretenimento
- Emoção
- Gostei da Música
- Ouviria Novamente

- Notas de 1 a 10 estrelas por critério
- Pode avaliar múltiplos candidatos

## 3. Sistema de votação

- Votação só liberada após o admin abrir para cada apresentação
- Interface com estrelas (1–10) para avaliação
- Todos os critérios obrigatórios
- Confirmação visual após o voto
- Bloqueio de candidatos não liberados

## 4. Candidatos

6 artistas pré-cadastrados com:

- Nome, música, gênero
- Foto, biografia
- Links para redes sociais (Instagram / YouTube)
- Tela de detalhes completa para cada artista

## 5. Ranking

- Pontuação ponderada: **60% jurados + 40% público**
- Visualização em tempo real
- Pódio visual (troféus para top 3)
- Detalhamento de votos por categoria
- Acessível para todos os perfis

## 6. Interface mobile first

- Design responsivo otimizado para celular
- Gradientes roxo/rosa
- Animações suaves
- Navegação intuitiva

## 7. Fluxo completo

Login → Seleção de perfil → Votação (conforme liberação do admin) → Ranking

## Desenvolvimento e implantação

- Especificação técnica: [DEVSPEC.md](./DEVSPEC.md) (inclui **Kubernetes** para API e frontend, §5.1).
- Plano por fases: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
- Guia de cluster: [deploy/kubernetes/README.md](./deploy/kubernetes/README.md).
