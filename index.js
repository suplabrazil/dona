// Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const path = require('path');

// Cria uma instância da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Configura o SDK do Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// Serve os ficheiros do site (Front-end)
app.use(express.static(path.join(__dirname, 'public')));

// Configurações do Servidor
app.use(cors());
app.use(express.json());

// Rota para criar o pagamento PIX
app.post('/criar-pagamento', async (req, res) => {
  try {
    const { valor, info } = req.body;

    if (!process.env.MP_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }

    const payment_data = {
      transaction_amount: Number(valor),
      description: info,
      payment_method_id: 'pix',
      payer: {
        email: 'comprador.dona.elma@email.com',
        first_name: 'Cliente',
        last_name: 'Dona Elma'
      }
    };

    const data = await mercadopago.payment.create(payment_data);

    // Envia de volta os dados do PIX E o ID do pagamento
    res.json({
      paymentId: data.body.id, // ID do pagamento, crucial para verificação
      qrCodeBase64: data.body.point_of_interaction.transaction_data.qr_code_base64,
      copiaECola: data.body.point_of_interaction.transaction_data.qr_code
    });

  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error.message);
    res.status(500).json({ error: 'Falha ao gerar o PIX.' });
  }
});

// --- NOVA ROTA PARA VERIFICAR O PAGAMENTO ---
app.get('/verificar-pagamento/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { body } = await mercadopago.payment.get(paymentId);
    
    // Envia o status do pagamento de volta para o site
    res.json({ status: body.status });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error.message);
    res.status(500).json({ error: 'Falha ao verificar o status do pagamento.' });
  }
});


// Rota principal que serve o seu site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
