// Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

// Cria uma instância da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO IMPORTANTE ---
// Configura o SDK do Mercado Pago com a sua chave secreta (Access Token)
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// --- CORREÇÃO DO CORS ---
// Lista de domínios permitidos a aceder a este servidor
const dominiosPermitidos = [
  'https://donaelma.com', 
  'http://127.0.0.1:5500' // Adicionado para testes locais, se necessário
];

const opcoesCors = {
  origin: function (origin, callback) {
    // Permite pedidos sem 'origin' (como apps mobile ou Postman) ou se o domínio estiver na lista
    if (!origin || dominiosPermitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  }
};

// Habilita o CORS com as opções específicas
app.use(cors(opcoesCors));
app.use(express.json());

// Rota principal para testar
app.get('/', (req, res) => {
  res.send('Servidor da Dona Elma com Mercado Pago está no ar!');
});

// Rota para criar o pagamento PIX
app.post('/criar-pagamento', async (req, res) => {
  try {
    const { valor, info } = req.body;

    // Validação básica para garantir que o token está configurado
    if (!process.env.MP_ACCESS_TOKEN) {
        console.error('ACCESS TOKEN do Mercado Pago não está configurado no Render.');
        return res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }

    const payment_data = {
      transaction_amount: Number(valor),
      description: info,
      payment_method_id: 'pix',
      payer: {
        email: 'test_user_123456@testuser.com', // E-mail de teste VÁLIDO exigido pelo MP
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

    console.log("A enviar os seguintes dados para o Mercado Pago:", JSON.stringify(payment_data, null, 2));

    const data = await mercadopago.payment.create(payment_data);
    
    console.log("Resposta recebida do Mercado Pago com sucesso.");

    const qrCodeBase64 = data.body.point_of_interaction.transaction_data.qr_code_base64;
    const copiaECola = data.body.point_of_interaction.transaction_data.qr_code;

    res.json({
      qrCodeBase64,
      copiaECola
    });

  } catch (error) {
    // Log detalhado do erro no console do servidor (Render)
    console.error('--- ERRO DETALHADO AO CRIAR PAGAMENTO PIX ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Mensagem de erro:', error.message);
    }
    console.error('---------------------------------------------');

    // Envia uma mensagem de erro mais detalhada para o front-end
    res.status(500).json({ error: 'Falha ao comunicar com o gateway de pagamento. Verifique os logs do servidor.' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
