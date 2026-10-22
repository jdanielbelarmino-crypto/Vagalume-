# Vagalume Multiplayer (Node.js)

Este projeto adiciona um servidor de salas multiplayer ao jogo Vagalume. O jogo continua desenhando e simulando o mundo no navegador; o servidor Node.js sincroniza presença/estado dos jogadores e limita as salas a 5 participantes.

## Instalação

1. Instale Node.js 18 ou superior.
2. Coloque o arquivo original `Vagalume.html` dentro da pasta `public/` e renomeie para `index.html`.
3. No terminal, dentro desta pasta, execute:

```bash
npm install
npm start
```

4. Abra `http://localhost:3000` no navegador. Para jogar com amigos pela internet, hospede o projeto em um serviço que aceite Node.js e use o endereço público HTTPS.

## Como jogar

- Abra o jogo e vá à opção de multijogador.
- Crie uma sala ou digite o código de uma sala existente.
- Compartilhe o mesmo endereço do site e o código com os amigos.

## Observações

- O servidor é um relay de presença, não um servidor autoritativo de física/combate: cada navegador ainda simula seu próprio mundo, como no HTML original.
- As salas e os jogadores são mantidos em memória; reiniciar o servidor encerra as salas.
- Para produção, configure HTTPS no host e restrinja CORS ao domínio do jogo.
