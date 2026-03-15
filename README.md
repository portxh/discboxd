# Discboxd 💿

Discboxd é uma plataforma premium para colecionadores de música, inspirada no design minimalista da Apple. Organize seu acervo, descubra novos álbuns e acompanhe sua jornada musical de forma elegante e funcional.

## ✨ Funcionalidades

- **Coleção Pessoal**: Adicione e remova álbuns do seu acervo digital com um clique.
- **Integração com Spotify**:
    - Busca global em tempo real na biblioteca do Spotify.
    - Login social (OAuth) simplificado.
    - Detecção automática do que você está ouvindo ("Listening Now").
- **Experiência Premium**:
    - Design baseado em Glassmorphism e Human Interface Guidelines.
    - Interface totalmente responsiva (Mobile-first).
    - Gestão de perfil com upload de avatar e customização de dados.
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
    - Execute o script `supabase_final.sql` no SQL Editor do seu projeto Supabase para criar as tabelas e políticas de segurança (RLS).
2.  **Variáveis de Ambiente**:
    - Configure suas chaves do Supabase no arquivo `./js/config/supabase.js`.
    - No arquivo `./js/services/spotifyAuth.js`, insira o seu `CLIENT_ID` do Spotify.
3.  **Dashboards**:
    - No Supabase, habilite o provider **Spotify** em *Authentication -> Providers* e configure o Redirect URI fornecido pelo Spotify.
    - No Spotify Developer Dashboard, adicione o callback do Supabase aos Redirect URIs autorizados.
4.  **Execução**:
    - Abra o `index.html` através de um servidor local.

---
Desenvolvido como projeto de portfólio musical.
