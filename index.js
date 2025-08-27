// Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const path = require('path'); // Módulo para lidar com caminhos de ficheiros

// Cria uma instância da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO IMPORTANTE ---
// Configura o SDK do Mercado Pago com a sua chave secreta (Access Token)
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// --- SERVIR FICHEIROS DO SITE (FRONT-END) ---
// Diz ao Express para usar a pasta 'public' para servir ficheiros estáticos (HTML, CSS, JS do site)
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURAÇÕES DO SERVIDOR ---
app.use(cors()); // Mesmo com tudo no mesmo domínio, é bom manter para flexibilidade
app.use(express.json());

// Rota para criar o pagamento PIX (A NOSSA API)
app.post('/criar-pagamento', async (req, res) => {
  try {
    const { valor, info } = req.body;

    if (!process.env.MP_ACCESS_TOKEN) {
        console.error('ACCESS TOKEN do Mercado Pago não está configurado no Render.');
        return res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }

    const payment_data = {
      transaction_amount: Number(valor),
      description: info,
      payment_method_id: 'pix',
      payer: {
        email: 'test_user_123456@testuser.com',
        first_name: 'Cliente',
        last_name: 'Dona Elma'
      }
    };

    const data = await mercadopago.payment.create(payment_data);

    const qrCodeBase64 = data.body.point_of_interaction.transaction_data.qr_code_base64;
    const copiaECola = data.body.point_of_interaction.transaction_data.qr_code;

    res.json({
      qrCodeBase64,
      copiaECola
    });

  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error.message);
    res.status(500).json({ error: 'Falha ao gerar o PIX.' });
  }
});

// Rota principal que agora serve o seu site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
