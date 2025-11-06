# Usa a imagem oficial do Node.js (versão 20)
FROM node:20-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de definição de dependências e instala
# Usamos --omit=dev para economizar espaço, já que dependências de desenvolvimento não são necessárias em produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia o restante do código da aplicação
# **Importante:** Se você usa a pasta 'uploads' para imagens, ela será copiada para o contêiner,
# mas NUNCA use o armazenamento local em produção (usaremos Firebase Storage depois).
COPY . .

# Expõe a porta que o seu servidor Express escuta (seu código usa process.env.PORT || 3000)
# O Cloud Run requer que o servidor escute na porta 8080 (que injetaremos via variável de ambiente)
EXPOSE 8080

# Comando para iniciar a aplicação
# O Cloud Run irá injetar a variável PORT, mas usaremos node server.js
CMD [ "node", "server.js" ]