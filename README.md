# Discboxd 💿

Discboxd é uma plataforma premium para colecionadores de música, inspirada no design minimalista da Apple. Organize seu acervo, descubra novos álbuns, interaja com amigos e acompanhe sua jornada musical de forma elegante e funcional.

## ✨ Funcionalidades

- **Coleção Pessoal**: Adicione e remova álbuns do seu acervo digital com um clique.
- **Integração com Spotify**:
    - Busca global em tempo real na biblioteca do Spotify.
    - Login social (OAuth) simplificado.
    - Detecção automática do que você está ouvindo ("Listening Now").
- **Comunidade e Interação**:
    - **Feed Social**: Acompanhe o que seus amigos estão adicionando ao acervo.
    - **Perfis Dinâmicos**: Siga usuários, veja suas coleções e estatísticas.
    - **Curtidas e Comentários**: Interaja nas resenhas feitas por outros usuários.
    - **Explorar**: Veja os álbuns mais colecionados e com as maiores notas da semana ou mês.
- **Painel de Administração**:
    - Visão exclusiva para administradores com métricas globais da plataforma.
    - Moderação de resenhas da comunidade (exclusão de conteúdos impróprios).
    - Gerenciamento de usuários com função de suspensão/banimento.
- **Experiência Premium**:
    - Design baseado em Glassmorphism e Human Interface Guidelines.
    - Interface totalmente responsiva (Mobile-first).
    - Gestão de perfil com upload de avatar e customização de dados (bio).
- **Organização Inteligente**:
    - Filtros dinâmicos na coleção local.
    - Ordenação por data de adição, lançamento ou nome.
    - Visualização detalhada de álbuns com tracklists completas.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 progressivo (Tailwind para utilitários), JavaScript Vanilla (ES6+).
- **Backend/BaaS**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage).
- **APIs Externa**: Spotify Web API.

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Um servidor local (ex: Live Server do VS Code) ou hospedagem estática.
- Credenciais da API do Spotify (Client ID/Secret).
- Um projeto configurado no Supabase.

### Passo a Passo
1.  **Configuração do Banco**:
    - Execute o script unificado `supabase_schema.sql` no SQL Editor do seu projeto Supabase. Ele já criará todas as tabelas, políticas de segurança (RLS), triggers de perfis e configurações de administração.
2.  **Variáveis de Ambiente**:
    - Configure suas chaves do Supabase no arquivo `./js/config/supabase.js`.
    - No arquivo `./js/services/spotifyAuth.js`, insira o seu `CLIENT_ID` do Spotify.
3.  **Autenticação**:
    - No Supabase, habilite o provider **Spotify** em *Authentication -> Providers* e configure o Redirect URI fornecido pelo Spotify.
    - No Spotify Developer Dashboard, adicione o callback do Supabase aos Redirect URIs autorizados.
4.  **Execução**:
    - Abra o `index.html` através de um servidor local.

---
Desenvolvido como projeto acadêmico de Projeto de Software.
