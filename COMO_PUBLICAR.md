# Como colocar o Imperium online (com GitHub e Supabase)

- **Supabase**: contas de jogador (login com e-mail e senha) e banco de dados do multiplayer.
- **GitHub Pages**: hospeda o jogo de graça num link como `https://SEU-USUARIO.github.io/imperium`.

Tudo é gratuito. São três partes: configurar o Supabase uma vez, publicar no GitHub uma vez e, depois, atualizar sempre que houver novidades.

> Enquanto o `supabase-config.js` estiver com `COLE_AQUI`, o botão **🌐 Jogar Online** funciona em **modo de teste local** (contas e salas só entre abas do mesmo navegador).

---

## Parte 1 — Supabase (uma vez só)

### 1. Criar o projeto
1. Entre em **https://supabase.com/dashboard** e clique em **New project**.
2. Nome: `imperium`. Crie uma senha para o banco (guarde, mas o jogo não usa). Região: **South America (São Paulo)**.
3. Espere uns 2 minutos até o projeto ficar pronto.

### 2. Criar as tabelas do jogo
1. No menu da esquerda, abra **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/setup.sql`** (pasta do jogo) no Bloco de Notas, copie **tudo** e cole no editor.
3. Clique em **Run**. Deve aparecer "Success. No rows returned".

### 3. Login sem e-mail de confirmação
1. Abra **Authentication** → **Sign In / Providers** (em versões antigas: **Providers**) → **Email**.
2. Deixe **Enable Email provider** ligado.
3. **Desligue "Confirm email"** e salve. Assim a conta é criada na hora, sem e-mail de verificação.
4. Em **Password requirements / Minimum password length**, coloque **8**, se essa opção aparecer.

### 4. Ligar o jogo ao seu projeto
1. Abra **Project Settings** (engrenagem) → **API** (ou **Data API**).
2. Copie a **Project URL** (ex.: `https://abcdefgh.supabase.co`) e a chave **anon public** (um texto longo começando com `eyJ...`).
3. Abra **`supabase-config.js`** no Bloco de Notas e troque os dois `COLE_AQUI`:
   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abcdefgh.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```
4. Salve. Pronto: a chave **anon** é pública por natureza, e quem protege os dados são as regras criadas pelo `setup.sql`.

> **Não use** a chave `service_role` (essa é secreta).

---

## Parte 2 — Publicar no GitHub Pages (uma vez só)

O repositório Git já está criado na pasta `imperium`, com os arquivos prontos para o primeiro commit.

### 1. Criar o repositório no GitHub
1. Entre em **https://github.com/new**.
2. Nome: `imperium`. Deixe **Public**. O GitHub Pages gratuito exige repositório público, e não há nada secreto no jogo.
3. **Não** marque "Add a README" nem nenhuma outra opção. Clique em **Create repository**.
4. Copie o endereço que aparece, algo como `https://github.com/SEU-USUARIO/imperium.git`.

### 2. Enviar o jogo
Me mande o endereço do repositório que eu deixo tudo configurado. Ou, se preferir fazer você mesmo, abra o terminal na pasta `imperium` e rode:
```
git remote add origin https://github.com/SEU-USUARIO/imperium.git
git push -u origin main
```
Na primeira vez, o Windows abre uma janela para você entrar na sua conta do GitHub. Basta autorizar.

### 3. Ligar o GitHub Pages
1. No repositório, abra **Settings** → **Pages**.
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Branch: **main**, pasta **/ (root)** → **Save**.
4. Depois de 1 ou 2 minutos, o link aparece no topo da página: `https://SEU-USUARIO.github.io/imperium/`.

Pronto: mande esse link para os amigos. Cada um cria a conta em **🌐 Jogar Online**.

---

## Parte 3 — Atualizações do jogo

Quando quiser mudar algo, é só me pedir a mudança e depois dizer **"faz o commit"** (e **"faz o push"** para publicar).
- O **commit** salva a versão no histórico do Git.
- O **push** envia para o GitHub, e o site se atualiza sozinho em 1 ou 2 minutos.

Se preferir fazer à mão:
```
git add -A
git commit -m "Descreva a mudança"
git push
```

---

## Como jogar online

1. Cada jogador abre o link, clica em **🌐 Jogar Online** e cria a conta (nome, e-mail e senha com 8 caracteres ou mais).
2. O **anfitrião** clica em **➕ Criar sala** e escolhe jogadores (até 5), época, modo e velocidade.
3. Ele passa o **código de 6 letras**, e os amigos entram em **🔑 Entrar com código**.
4. Cada um escolhe sua nação, e o anfitrião clica em **▶ Iniciar partida**.
5. Os meses avançam sozinhos, sem pausa. O botão **👥** abre alianças, comércio, paz, guerra e mensagens.
6. A sala fica em **Minhas salas**. Para continuar outro dia, o anfitrião abre o lobby e clica em **▶ Retomar partida**.

> O anfitrião faz o mundo andar. Se ele sair, os meses param até ele voltar.

## Limites do plano gratuito do Supabase
- **500 MB** de banco e **2 milhões de mensagens em tempo real por mês**. Uma partida com 5 jogadores usa bem menos do que isso.
- Projetos gratuitos **pausam depois de 7 dias sem uso**. Se acontecer, entre no painel do Supabase e clique em **Restore project**: nada é perdido.
