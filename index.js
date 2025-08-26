// Importa o framework Express
const express = require('express');
// Cria uma instância da aplicação
const app = express();
// Define a porta do servidor, usando a porta que o Render nos dá ou a 3000 como padrão
const PORT = process.env.PORT || 3000;

// Cria uma rota principal para testar se o servidor está a funcionar
app.get('/', (req, res) => {
  res.send('Servidor da Dona Elma está no ar!');
});

// Inicia o servidor e fica à escuta na porta definida
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
