# Roadmap de Desenvolvimento - Discboxd (Planejamento ACs)

Este planejamento organiza as funcionalidades do projeto de acordo com as metas das Avaliações Continuadas (ACs) da faculdade.

---

## 🚀 AC1: Identidade e Autenticação (Estado Atual)
*Foco na estrutura inicial do sistema, interface e gestão de acesso.*

- [x] **Interface do Usuário (Landing Page)**: Desenvolvimento da home minimalista e portais de acesso.
- [x] **Estrutura de Login/Cadastro**: Fluxo completo de autenticação via e-mail e senha.
- [x] **Integração com Supabase (Auth)**: Configuração do provedor de backend para gestão de usuários.
- [x] **Integração Spotify OAuth**: Login social centralizado para agilizar o onboarding.
- [x] **Dashboard Base**: Estrutura de visualização do perfil e interface do dashboard.
- [x] **Base de Dados de Perfis**: Trigger SQL para criação e sincronização de dados de usuários autenticados.

## 📋 AC2: Funcionalidade da Coleção (Core Musical)
*Foco na integração de dados e gestão do acervo pessoal.*

- [x] **Integração Spotify API**: Implementação da busca de álbuns e recuperação de dados em tempo real.
- [x] **Montagem da Coleção**: Funcionalidade de adicionar e remover álbuns da conta do usuário.
- [x] **Persistência de Dados (Coleção)**: Integração com o banco de dados para salvar a biblioteca do usuário.
- [x] **Filtros e Visualização**: Implementação de visualização em grid e filtros locais no acervo.

## 🔮 AC3: Resenhas e Interatividade Social
*Foco na avaliação pessoal e recursos de rede social.*

- [x] **Avaliações Pessoais**: Sistema de notas (estrelas) para cada álbum da coleção.
- [x] **Resenhas de Álbuns**: Área para o usuário escrever suas críticas e reflexões sobre os discos.
- [x] **Interação com a Comunidade**: Atividade social, permitindo visualizar descobertas de outros usuários.
- [x] **Busca de Usuários**: Encontrar outros perfis e coleções na plataforma.

---

### 🛠️ Tecnologias
- **Frontend**: HTML5 / CSS3 / Vanilla JS.
- **Backend/DB**: Supabase.
- **API**: Spotify Web API.
