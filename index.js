// Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

// Cria uma instância da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO IMPORTANTE ---
// Configura o SDK do Mercado Pago com a sua chave secreta (Access Token)
// A chave será lida de uma variável de ambiente no Render para segurança
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// Configurações do servidor (Middlewares)
app.use(cors());
app.use(express.json());

// Rota principal para testar
app.get('/', (req, res) => {
  res.send('Servidor da Dona Elma com Mercado Pago está no ar!');
});

// Rota para criar o pagamento PIX
app.post('/criar-pagamento', async (req, res) => {
  try {
    const { valor, info } = req.body;

    // Cria um objeto com os dados do pagamento
    const payment_data = {
      transaction_amount: Number(valor),
      description: info,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@email.com', // Email genérico, pode ser melhorado depois
        first_name: 'Cliente',
        last_name: 'Dona Elma',
        address: {
          zip_code: '01001000',
          street_name: 'Rua Exemplo',
          street_number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          federal_unit: 'SP'
        }
      }
    };

    // Cria o pagamento usando o SDK
    const data = await mercadopago.payment.create(payment_data);

    // Extrai os dados do PIX da resposta
    const qrCodeBase64 = data.body.point_of_interaction.transaction_data.qr_code_base64;
    const copiaECola = data.body.point_of_interaction.transaction_data.qr_code;

    // Envia os dados de volta para o site
    res.json({
      qrCodeBase64,
      copiaECola
    });

  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    res.status(500).json({ error: 'Falha ao gerar o PIX.' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
