const express = require('express');
const cors = require('cors');
const path = require('path');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();

// --- CONFIGURAÇÃO ---
const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
    console.error("ERRO: A chave de acesso do Mercado Pago (MP_ACCESS_TOKEN) não foi definida nas variáveis de ambiente.");
}
const client = new MercadoPagoConfig({ accessToken });
const payment = new Payment(client);

// --- MIDDLEWARE ---
// Habilita o CORS para permitir que o seu domínio se comunique com o servidor
const corsOptions = {
    origin: ['https://donaelma.com', 'https://www.donaelma.com', 'https://dona-5pul.onrender.com'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Habilita o parsing de JSON no corpo das requisições
app.use(express.json());

// Serve os ficheiros estáticos (o seu site) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- ROTAS ---

// Rota principal que serve o seu site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para criar um pagamento PIX
app.post('/criar-pagamento', async (req, res) => {
    console.log("A receber pedido para criar pagamento...");
    if (!accessToken) {
        return res.status(500).json({ error: "O servidor não está configurado para pagamentos." });
    }

    try {
        const { valorTotal, nomeCliente, enderecoCliente, itemsDescription } = req.body;

        if (!valorTotal || !nomeCliente || !enderecoCliente || !itemsDescription) {
             return res.status(400).json({ error: 'Dados do pedido incompletos.' });
        }

        const paymentData = {
            body: {
                transaction_amount: Number(valorTotal),
                description: `Pedido para ${nomeCliente} em ${enderecoCliente}: ${itemsDescription}`,
                payment_method_id: 'pix',
                payer: {
                    email: `cliente_${Date.now()}@donaelma.com`, // Email único para cada transação
                    first_name: nomeCliente,
                    last_name: 'Cliente',
                    address: {
                        street_name: enderecoCliente,
                        street_number: 123
                    }
                },
                notification_url: "https://dona-5pul.onrender.com/webhook" // Opcional: para receber notificações de pagamento
            }
        };

        console.log("A enviar os seguintes dados para o Mercado Pago:", JSON.stringify(paymentData, null, 2));
        
        const result = await payment.create(paymentData);
        
        console.log("Pagamento criado com sucesso:", result.id);

        res.json({
            paymentId: result.id,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
            copiaECola: result.point_of_interaction.transaction_data.qr_code
        });

    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error?.cause ?? error.message);
        const errorMessage = error.cause?.error?.message || 'Ocorreu um erro desconhecido ao comunicar com o sistema de pagamentos.';
        res.status(500).json({ error: errorMessage });
    }
});

// Rota para verificar o status do pagamento
app.get('/verificar-pagamento/:id', async (req, res) => {
    try {
        const paymentDetails = await payment.get({ id: req.params.id });
        res.json({ status: paymentDetails.status });
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error.message);
        res.status(500).json({ error: 'Erro ao verificar o status do pagamento.' });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}. O serviço está live.`);
});
