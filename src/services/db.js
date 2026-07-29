// Banco de dados em LocalStorage para Orçamentos e Biblioteca de Serviços
// Suporta sincronização automática com Google Sheets (via Apps Script API) se configurado.

const DEFAULT_SERVICES = [
  // CATEGORIA: PREPARAÇÃO
  { id: "prep-lavacao-externa", name: "Lavação externa", category: "PREPARAÇÃO", defaultText: "Lavagem técnica das paredes e superfícies externas com lavadora de alta pressão para remoção de algas, poeira e sujidades, garantindo perfeita aderência.", active: true },
  { id: "prep-lixamento-janelas", name: "Lixamento de janelas", category: "PREPARAÇÃO", defaultText: "Lixamento cuidadoso das esquadrias de janelas para remoção de vernizes/tintas antigas e preparação da madeira ou metal para nova pintura.", active: true },
  { id: "prep-lixamento-portas", name: "Lixamento de portas", category: "PREPARAÇÃO", defaultText: "Lixamento detalhado das folhas de portas, aduelas e alizares para nivelamento e abertura de porosidade, promovendo acabamento liso.", active: true },
  { id: "prep-lixamento-reboco", name: "Lixamento do reboco", category: "PREPARAÇÃO", defaultText: "Lixamento de rebocos novos ou corrigidos para eliminar grãos de areia soltos e promover uma superfície mais regular para o fundo preparador.", active: true },
  { id: "prep-lixamento-superficies", name: "Lixamento de superfícies", category: "PREPARAÇÃO", defaultText: "Lixamento geral das superfícies para uniformidade, eliminação de imperfeições e abertura de ancoragem para as demãos de acabamento.", active: true },
  { id: "prep-abertura-trincas", name: "Respagem e abertura de trincas e fissuras", category: "PREPARAÇÃO", defaultText: "Abertura em 'V' de trincas e fissuras, com remoção de partes soltas para posterior aplicação de selante elastomérico.", active: true },
  { id: "prep-consertos-internos", name: "Consertos e correções das paredes internas", category: "PREPARAÇÃO", defaultText: "Correção pontual de imperfeições em paredes internas utilizando massa corrida e lixamento fino para acabamento perfeito.", active: true },
  { id: "prep-consertos-externos", name: "Consertos e correções paredes externas", category: "PREPARAÇÃO", defaultText: "Consertos pontuais em paredes externas utilizando massa acrílica de alta resistência, promovendo nivelamento e proteção contra umidade.", active: true },
  { id: "prep-consertos-teto", name: "Consertos e correções do teto", category: "PREPARAÇÃO", defaultText: "Correções de ondulações e imperfeições em tetos com aplicação de massa e lixamento sob iluminação focada.", active: true },
  { id: "prep-gesso-teto", name: "Conserto de gesso nos tetos", category: "PREPARAÇÃO", defaultText: "Tratamento de emendas, fissuras ou ondulações em placas de gesso cartonado (drywall) ou plaquinhas de teto.", active: true },
  { id: "prep-gesso-banheiro", name: "Conserto de gesso nos tetos do banheiro", category: "PREPARAÇÃO", defaultText: "Reparo em gesso de áreas úmidas utilizando massa apropriada e tratamento antifungo para evitar bolores.", active: true },
  { id: "prep-fundo-preparador", name: "Aplicação de fundo preparador de paredes", category: "PREPARAÇÃO", defaultText: "Aplicação de 1 demão de fundo preparador para aglutinar partículas soltas, selar e uniformizar a absorção da parede.", active: true },
  { id: "prep-isolamento-portas-janelas", name: "Isolamento de portas e janelas", category: "PREPARAÇÃO", defaultText: "Proteção minuciosa de caixilhos, vidros, ferragens e esquadrias de portas e janelas com fita crepe azul de alta performance.", active: true },
  { id: "prep-isolamento-piso", name: "Isolamento de piso", category: "PREPARAÇÃO", defaultText: "Forração completa de todos os pisos das áreas de trabalho com lona plástica pesada ou papelão protetor para evitar respingos.", active: true },
  { id: "prep-isolamento-moveis", name: "Isolamento de móveis", category: "PREPARAÇÃO", defaultText: "Proteção de mobiliários existentes no local com plástico eletrostático protetor, isolando-os da poeira e névoa de tinta.", active: true },
  { id: "prep-isolamento-total", name: "Isolamento total da obra", category: "PREPARAÇÃO", defaultText: "Proteção e blindagem de todas as superfícies que não serão pintadas (pisos, móveis, vidros, tomadas, interruptores e luminárias).", active: true },
  { id: "prep-calafetacao-rodapes", name: "Calafetação de rodapés", category: "PREPARAÇÃO", defaultText: "Preenchimento de frestas entre rodapés e paredes com selante acrílico flexível, promovendo acabamento contínuo e limpo.", active: true },
  { id: "prep-lixamento-pintura-rodapes", name: "Lixamento e pintura de rodapés", category: "PREPARAÇÃO", defaultText: "Lixamento fino e aplicação de esmalte premium em rodapés, garantindo alta durabilidade contra impactos e limpezas cotidianas.", active: true },
  { id: "prep-lixamento-recuperacao-deck", name: "Lixamento e recuperação do deck", category: "PREPARAÇÃO", defaultText: "Lixamento mecânico pesado de decks de madeira para remoção de camadas velhas de verniz/stain e exposição da madeira nova.", active: true },
  { id: "prep-remocao-textura", name: "Remoção de textura", category: "PREPARAÇÃO", defaultText: "Raspagem mecânica ou química de texturas antigas para retorno da parede ao estado plano.", active: true },
  { id: "prep-conserto-textura", name: "Conserto das texturas", category: "PREPARAÇÃO", defaultText: "Refacção pontual e emendas de texturas existentes para camuflar reparos estruturais anteriores.", active: true },
  { id: "prep-lavacao-consertos-piso", name: "Lavação e consertos do piso", category: "PREPARAÇÃO", defaultText: "Limpeza técnica do piso pós-preparação e pequenos reparos em rejuntes ou fissuras necessárias.", active: true },
  { id: "prep-lavacao-telhado", name: "Lavação do telhado", category: "PREPARAÇÃO", defaultText: "Lavagem com hidrojateamento de alta pressão para remoção de limo, sujeira e contaminações em telhas.", active: true },

  // CATEGORIA: PINTURA
  { id: "pint-massa-corrida", name: "Aplicação de massa corrida", category: "PINTURA", defaultText: "Aplicação de massa corrida em demãos sucessivas em áreas internas para obtenção de superfícies perfeitamente lisas.", active: true },
  { id: "pint-massa-acrilica", name: "Aplicação de massa acrilica", category: "PINTURA", defaultText: "Aplicação de massa acrílica de alta resistência em áreas externas ou úmidas, garantindo barreira contra intempéries.", active: true },
  { id: "pint-tinta-fosca-tetos", name: "Aplicação de tinta fosca nos tetos", category: "PINTURA", defaultText: "Pintura de tetos com tinta acrílica de acabamento fosco aveludado, ideal para disfarçar imperfeições e evitar reflexos.", active: true },
  { id: "pint-tinta-fosca-interna", name: "Aplicação de tinta fosca nas paredes internas", category: "PINTURA", defaultText: "Aplicação de tinta acrílica fosca premium em paredes internas, offering uniformidade e toque fosco.", active: true },
  { id: "pint-tinta-fosca-externa", name: "Aplicação de tinta fosca paredes externas", category: "PINTURA", defaultText: "Aplicação de tinta acrílica fosca em paredes externas, com alta resistência aos raios UV e ação do tempo.", active: true },
  { id: "pint-tinta-acetinada-interna", name: "Aplicação de tinta acetinada paredes internas", category: "PINTURA", defaultText: "Pintura de paredes internas com acabamento acetinado de alta lavabilidade, toque de seda e brilho discreto.", active: true },
  { id: "pint-tinta-acetinada-externa", name: "Aplicação tinta acetinada paredes externas", category: "PINTURA", defaultText: "Aplicação de tinta acrílica de acabamento acetinado para áreas externas, proporcionando toque nobre e facilidade de limpeza.", active: true },
  { id: "pint-primer-aderencia", name: "Aplicação de primer de aderência", category: "PINTURA", defaultText: "Aplicação de primer promotor de aderência em superfícies lisas ou de difícil ancoragem (azulejos, metais, plásticos).", active: true },
  { id: "pint-tinta-epoxi", name: "Aplicação de tinta epóxi", category: "PINTURA", defaultText: "Aplicação de tinta epóxi de alta durabilidade e resistência mecânica/química em pisos ou paredes apropriadas.", active: true },
  { id: "pint-esmalte-sintetico", name: "Aplicação de esmalte sintético", category: "PINTURA", defaultText: "Pintura de esquadrias metálicas ou madeiras com esmalte sintético premium, oferecendo excelente nivelamento.", active: true },
  { id: "pint-esmalte-agua", name: "Aplicação de esmalte à base de água", category: "PINTURA", defaultText: "Aplicação de esmalte acrílico base água (baixo odor, não amarela com o tempo) em portas e guarnições.", active: true },
  { id: "pint-verniz", name: "Aplicação de verniz", category: "PINTURA", defaultText: "Aplicação de verniz de alta proteção em superfícies de madeira, garantindo impermeabilização contra umidade e sol.", active: true },
  { id: "pint-verniz-impregnante", name: "Aplicação de verniz impregnante", category: "PINTURA", defaultText: "Aplicação de stain impregnante de alta performance em decks ou painéis de madeira, protegendo contra cupins, fungos e sol.", active: true },
  { id: "pint-tinta-pu", name: "Aplicação de tinta P.U.", category: "PINTURA", defaultText: "Pintura de alta performance com poliuretano (P.U.), proporcionando máxima resistência contra abrasão e intempéries.", active: true },
  { id: "pint-tf7", name: "Aplicação de primer convertedor de ferrugem TF7", category: "PINTURA", defaultText: "Tratamento de pontos de corrosão em metais ferrosos com convertedor TF7, neutralizando a ferrugem antes da pintura.", active: true },
  { id: "pint-hammerite", name: "Aplicação tinta hammerite", category: "PINTURA", defaultText: "Aplicação de tinta esmalte Hammerite diretamente sobre ferro e ferrugem, proporcionando proteção anticorrosiva de longa duração.", active: true },
  { id: "pint-tinta-emborrachada", name: "Aplicação de tinta emborrachada", category: "PINTURA", defaultText: "Aplicação de tinta acrílica emborrachada flexível, recomendada para fachadas por acompanhar microfissuras da estrutura.", active: true },
  { id: "pint-manta-liquida", name: "Aplicação de manta liquida", category: "PINTURA", defaultText: "Aplicação de impermeabilizante de base asfáltica ou acrílica elastomérica em lajes, calhas ou coberturas.", active: true },
  { id: "pint-borracha-liquida", name: "Aplicação de borracha líquida", category: "PINTURA", defaultText: "Aplicação de revestimento de borracha líquida modificada, promovendo isolamento térmico, acústico e vedação total contra infiltrações.", active: true },
  { id: "pint-pintura-forro", name: "Pintura de Forro", category: "PINTURA", defaultText: "Lixamento leve e pintura de superfícies de forro de madeira ou gesso com tinta acrílica premium, garantindo cobertura uniforme, proteção e acabamento fosco ou acetinado de alto padrão.", active: true },
  { id: "pint-pintura-caibro", name: "Pintura de Caibro", category: "PINTURA", defaultText: "Lixamento e pintura de caibros de madeira da estrutura do telhado com tinta esmalte ou esmalte acrílico premium, oferecendo proteção contra umidade, cupins e acabamento homogêneo.", active: true },
  { id: "pint-pintura-sarrafo-telha", name: "Pintura de Sarrafo de Telha", category: "PINTURA", defaultText: "Pintura técnica dos sarrafos de madeira que sustentam as telhas, utilizando esmalte protetor de alta resistência contra umidade, fungos e ações do tempo.", active: true },
  { id: "pint-verniz-forro", name: "Verniz de Forro", category: "PINTURA", defaultText: "Lixamento fino e aplicação de verniz de alta proteção com filtro solar em forros de madeira, impermeabilizando a superfície contra umidade e poeira, enquanto realça os veios naturais da madeira.", active: true },
  { id: "pint-verniz-caibro", name: "Verniz de Caibro", category: "PINTURA", defaultText: "Lixamento e aplicação de verniz marítimo ou stain impregnante nos caibros de madeira estruturais do telhado, garantindo selagem total contra intempéries e realçando a tonalidade natural da madeira exposta.", active: true },
  { id: "pint-verniz-sarrafo-telha", name: "Verniz de Sarrafo de Telha", category: "PINTURA", defaultText: "Aplicação de verniz protetor ou stain preservativo nos sarrafos de madeira que dão suporte às telhas, prevenindo o apodrecimento, a umidade residual da cobertura e o ataque de cupins.", active: true },

  // CATEGORIA: REVESTIMENTOS
  { id: "revest-textura-projetada", name: "Textura projetada", category: "REVESTIMENTOS", defaultText: "Aplicação de revestimento texturizado acrílico por sistema de projeção pneumática e desempenamento pontual.", active: true },
  { id: "revest-textura-rolada", name: "Textura rolada", category: "REVESTIMENTOS", defaultText: "Aplicação de textura acrílica de média espessura com rolo de nylon apropriado, criando efeito de ranhuras suaves.", active: true },
  { id: "revest-grafiato", name: "Grafiato", category: "REVESTIMENTOS", defaultText: "Aplicação de revestimento rústico de grafiato com grânulos minerais, criando riscos decorativos marcantes de alta resistência.", active: true },

  // CATEGORIA: EFEITOS DECORATIVOS
  { id: "efeito-marmore", name: "Efeito Mármore", category: "EFEITOS DECORATIVOS", defaultText: "Aplicação artística de revestimento italiano imitando veios e profundidades de mármores nobres com polimento e espelhamento.", active: true },
  { id: "efeito-cimento-fosco", name: "Cimento queimado fosco", category: "EFEITOS DECORATIVOS", defaultText: "Revestimento com textura moderna de cimento queimado de acabamento fosco industrial, ideal para ambientes internos contemporâneos.", active: true },
  { id: "efeito-cimento-polido", name: "Cimento queimado polido", category: "EFEITOS DECORATIVOS", defaultText: "Aplicação de cimento queimado com lixamento fino e cera protetora de alto brilho, conferindo sofisticação e toque sedoso.", active: true },
  { id: "efeito-pedras-naturais", name: "Pedras naturais", category: "EFEITOS DECORATIVOS", defaultText: "Revestimento texturizado composto por micro-pedras naturais de quartzo ou silicatos, oferecendo rusticidade elegante.", active: true },
  { id: "efeito-rocha", name: "Efeito rocha", category: "EFEITOS DECORATIVOS", defaultText: "Técnica decorativa com massa especial esculpida para recriar as texturas e relevos irregulares de pedras brutas e rochas.", active: true },
  { id: "efeito-velvet", name: "Efeito Velvet", category: "EFEITOS DECORATIVOS", defaultText: "Efeito decorativo sofisticado com micro-esferas de brilho perolado que refletem a luz de forma suave, lembrando o toque de veludo molhado.", active: true },

  // CATEGORIA: EQUIPAMENTOS E DIFERENCIAIS
  { id: "equip-mecanizada", name: "Pintura mecanizada", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Execução de pintura profissional mecanizada de alto rendimento, garantindo perfeita homogeneidade de película.", active: true },
  { id: "equip-airless-graco", name: "Airless Graco", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Uso de sistema de pulverização airless da marca líder Graco, promovendo pintura sem névoa e acabamento de fábrica de alta fidelidade.", active: true },
  { id: "equip-airless-menegotti", name: "Airless Menogotti", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Utilização de equipamento de projeção Airless Menogotti para agilidade nas demãos de seladores e tintas.", active: true },
  { id: "equip-nauber-nb80", name: "Projetada Nauber NB-80", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Aplicação mecanizada de revestimentos densos utilizando projetora pneumática profissional Nauber NB-80.", active: true },
  { id: "equip-massa-nauber-nb80", name: "Máquina de massa Corrida NB-80", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Uso de projetora de massa airless Nauber NB-80 para aplicação homogênea e rápida de massa corrida em paredes e tetos.", active: true },
  { id: "equip-lixamento-mirka", name: "Lixamento Zero-Pó Mirka", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Utilização de lixadeiras ergonômicas Mirka acopladas a aspirador industrial de alta potência para obra limpa, sem nuvens de poeira.", active: true },
  { id: "equip-andaimes-proprios", name: "Andaimes próprios", category: "EQUIPAMENTOS E DIFERENCIAIS", defaultText: "Montagem de andaimes tubulares próprios de aço certificados NR18 para execução ágil e segura em grandes alturas.", active: true }
];

const SERVICE_DEFAULTS = {
  "prep-lavacao-externa": { unit: "m²", unitPrice: 12.00 },
  "prep-lixamento-janelas": { unit: "un", unitPrice: 150.00 },
  "prep-lixamento-portas": { unit: "un", unitPrice: 180.00 },
  "prep-lixamento-reboco": { unit: "m²", unitPrice: 8.00 },
  "prep-lixamento-superficies": { unit: "m²", unitPrice: 6.00 },
  "prep-abertura-trincas": { unit: "m.l.", unitPrice: 15.00 },
  "prep-consertos-internos": { unit: "m²", unitPrice: 18.00 },
  "prep-consertos-externos": { unit: "m²", unitPrice: 22.00 },
  "prep-consertos-teto": { unit: "m²", unitPrice: 20.00 },
  "prep-gesso-teto": { unit: "m²", unitPrice: 25.00 },
  "prep-gesso-banheiro": { unit: "un", unitPrice: 150.00 },
  "prep-fundo-preparador": { unit: "m²", unitPrice: 7.05 },
  "prep-isolamento-portas-janelas": { unit: "un", unitPrice: 40.00 },
  "prep-isolamento-piso": { unit: "m²", unitPrice: 5.00 },
  "prep-isolamento-moveis": { unit: "un", unitPrice: 50.00 },
  "prep-isolamento-total": { unit: "global", unitPrice: 500.00 },
  "prep-calafetacao-rodapes": { unit: "m.l.", unitPrice: 8.00 },
  "prep-lixamento-pintura-rodapes": { unit: "m.l.", unitPrice: 18.00 },
  "prep-lixamento-recuperacao-deck": { unit: "m²", unitPrice: 85.00 },
  "prep-remocao-textura": { unit: "m²", unitPrice: 45.00 },
  "prep-conserto-textura": { unit: "m²", unitPrice: 35.00 },
  "prep-lavacao-consertos-piso": { unit: "m²", unitPrice: 15.00 },
  "prep-lavacao-telhado": { unit: "m²", unitPrice: 18.00 },
  "pint-massa-corrida": { unit: "m²", unitPrice: 28.00 },
  "pint-massa-acrilica": { unit: "m²", unitPrice: 35.00 },
  "pint-tinta-fosca-tetos": { unit: "m²", unitPrice: 22.00 },
  "pint-tinta-fosca-interna": { unit: "m²", unitPrice: 24.00 },
  "pint-tinta-fosca-externa": { unit: "m²", unitPrice: 28.00 },
  "pint-tinta-acetinada-interna": { unit: "m²", unitPrice: 28.00 },
  "pint-tinta-acetinada-externa": { unit: "m²", unitPrice: 32.00 },
  "pint-primer-aderencia": { unit: "m²", unitPrice: 12.00 },
  "pint-tinta-epoxi": { unit: "m²", unitPrice: 45.00 },
  "pint-esmalte-sintetico": { unit: "m²", unitPrice: 38.00 },
  "pint-esmalte-agua": { unit: "m²", unitPrice: 40.00 },
  "pint-verniz": { unit: "m²", unitPrice: 35.00 },
  "pint-verniz-impregnante": { unit: "m²", unitPrice: 38.00 },
  "pint-tinta-pu": { unit: "m²", unitPrice: 55.00 },
  "pint-tf7": { unit: "m.l.", unitPrice: 18.00 },
  "pint-hammerite": { unit: "m²", unitPrice: 45.00 },
  "pint-tinta-emborrachada": { unit: "m²", unitPrice: 32.00 },
  "pint-manta-liquida": { unit: "m²", unitPrice: 38.00 },
  "pint-borracha-liquida": { unit: "m²", unitPrice: 48.05 },
  "pint-pintura-forro": { unit: "m²", unitPrice: 25.00 },
  "pint-pintura-caibro": { unit: "m.l.", unitPrice: 15.00 },
  "pint-pintura-sarrafo-telha": { unit: "m.l.", unitPrice: 10.00 },
  "pint-verniz-forro": { unit: "m²", unitPrice: 30.00 },
  "pint-verniz-caibro": { unit: "m.l.", unitPrice: 18.00 },
  "pint-verniz-sarrafo-telha": { unit: "m.l.", unitPrice: 12.00 },
  "revest-textura-projetada": { unit: "m²", unitPrice: 38.00 },
  "revest-textura-rolada": { unit: "m²", unitPrice: 28.00 },
  "revest-grafiato": { unit: "m²", unitPrice: 35.00 },
  "efeito-marmore": { unit: "m²", unitPrice: 150.00 },
  "efeito-cimento-fosco": { unit: "m²", unitPrice: 65.00 },
  "efeito-cimento-polido": { unit: "m²", unitPrice: 85.05 },
  "efeito-pedras-naturais": { unit: "m²", unitPrice: 95.00 },
  "efeito-rocha": { unit: "m²", unitPrice: 120.00 },
  "efeito-velvet": { unit: "m²", unitPrice: 110.00 },
  "equip-mecanizada": { unit: "m²", unitPrice: 15.00 },
  "equip-airless-graco": { unit: "dia", unitPrice: 250.00 },
  "equip-airless-menegotti": { unit: "dia", unitPrice: 180.00 },
  "equip-nauber-nb80": { unit: "dia", unitPrice: 350.00 },
  "equip-massa-nauber-nb80": { unit: "dia", unitPrice: 400.00 },
  "equip-lixamento-mirka": { unit: "m²", unitPrice: 10.00 },
  "equip-andaimes-proprios": { unit: "global", unitPrice: 300.00 }
};

// Mutar em local os itens padrões com preços e unidades
DEFAULT_SERVICES.forEach((s) => {
  const d = SERVICE_DEFAULTS[s.id];
  if (d) {
    s.unit = d.unit;
    s.unitPrice = d.unitPrice;
  } else {
    s.unit = "m²";
    s.unitPrice = 0;
  }
});

// Inicializar banco de dados local com mesclagem inteligente de novos itens padrões
const initDB = () => {
  const localLibrary = localStorage.getItem("jp_services_library");
  if (!localLibrary) {
    localStorage.setItem("jp_services_library", JSON.stringify(DEFAULT_SERVICES));
  } else {
    try {
      const current = JSON.parse(localLibrary);
      if (Array.isArray(current)) {
        let needsUpdate = false;
        
        // Enriquecer itens existentes que não possuem unit ou unitPrice
        const upgraded = current.map(item => {
          const d = SERVICE_DEFAULTS[item.id];
          if (d && (item.unit === undefined || item.unitPrice === undefined)) {
            needsUpdate = true;
            return {
              ...item,
              unit: item.unit || d.unit,
              unitPrice: item.unitPrice !== undefined ? item.unitPrice : d.unitPrice
            };
          }
          return item;
        });

        // Identificar itens padrões novos que não estão na biblioteca local
        const missing = DEFAULT_SERVICES.filter(def => !upgraded.some(curr => curr.id === def.id));
        if (missing.length > 0) {
          upgraded.push(...missing);
          needsUpdate = true;
        }

        if (needsUpdate) {
          localStorage.setItem("jp_services_library", JSON.stringify(upgraded));
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar biblioteca local:", e);
    }
  }
  if (!localStorage.getItem("jp_budgets")) {
    localStorage.setItem("jp_budgets", JSON.stringify([]));
  }
};

initDB();

const getApiUrl = () => {
  return localStorage.getItem("jp_google_api_url") || 'https://script.google.com/macros/s/AKfycbxNADjlvckre4pXCicjyw6VpO8I9jN6xtYEhM1lfrMyJQvnmX9zIGVz0ZoqGbvYqZcTKQ/exec';
};

const BAKED_SUPABASE_URL = "https://pnasppquvknrukzrlxhq.supabase.co";
const BAKED_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuYXNwcHF1dmtucnVrenJseGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyODg4NjQsImV4cCI6MjEwMDg2NDg2NH0.JfmH0QiBNlK8KJd8zmYnGEFWYAVXIubeyC45sEOedqs";

const getSupabaseConfig = () => {
  const url = localStorage.getItem("jp_supabase_url") || BAKED_SUPABASE_URL;
  const key = localStorage.getItem("jp_supabase_anon_key") || BAKED_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
};

const getSyncProvider = () => {
  const provider = localStorage.getItem("jp_sync_provider");
  if (provider) return provider;
  if (getSupabaseConfig()) return "supabase";
  return "local";
};

const fetchSupabase = async (path, options = {}) => {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase não configurado.");
  
  const url = `${config.url}/rest/v1/${path}`;
  const token = localStorage.getItem("jp_auth_token") || config.key;

  const headers = {
    "apikey": config.key,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers
  };

  const response = await fetchWithTimeout(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Supabase: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response;
};

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 4000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const db = {
  // --- Configurações de Conexão ---
  getSyncProvider,
  getSupabaseConfig,

  // --- Autenticação ---
  auth: {
    login: async (email, password) => {
      const config = getSupabaseConfig();
      if (!config) throw new Error("Supabase não configurado.");

      const url = `${config.url}/auth/v1/token?grant_type=password`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "apikey": config.key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error_description || errData.error || "E-mail ou senha incorretos.");
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("jp_auth_token", data.access_token);
        localStorage.setItem("jp_auth_user", JSON.stringify(data.user));
        localStorage.setItem("jp_sync_provider", "supabase");
        return data.user;
      }
      throw new Error("Token de acesso inválido.");
    },

    logout: () => {
      localStorage.removeItem("jp_auth_token");
      localStorage.removeItem("jp_auth_user");
    },

    getCurrentUser: () => {
      const userStr = localStorage.getItem("jp_auth_user");
      const token = localStorage.getItem("jp_auth_token");
      if (!token || !userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  },

  // --- Configurações Sincronizadas ---
  getSettings: async () => {
    const provider = getSyncProvider();
    if (provider === "supabase") {
      try {
        const res = await fetchSupabase("settings?key=eq.global");
        const data = await res.json();
        if (data && data.length > 0) {
          const settings = data[0].value;
          if (settings.gemini_api_key) {
            localStorage.setItem("jp_gemini_api_key", settings.gemini_api_key);
          }
          return settings;
        }
      } catch (e) {
        console.error("Erro ao obter settings do Supabase:", e);
      }
    }
    return null;
  },

  saveSettings: async (settings) => {
    if (settings.gemini_api_key) {
      localStorage.setItem("jp_gemini_api_key", settings.gemini_api_key);
    }
    const provider = getSyncProvider();
    if (provider === "supabase") {
      try {
        await fetchSupabase("settings?key=eq.global", {
          method: "POST",
          headers: {
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify({
            key: "global",
            value: settings,
            updated_at: new Date().toISOString()
          })
        });
      } catch (e) {
        console.error("Erro ao salvar settings no Supabase:", e);
      }
    }
  },

  // --- Biblioteca de Serviços ---
  getLibrary: async () => {
    const provider = getSyncProvider();
    if (provider === "supabase") {
      try {
        const res = await fetchSupabase("services?select=*");
        const services = await res.json();
        if (Array.isArray(services) && services.length > 0) {
          // Identificar se há itens padrões novos que não estão salvos na nuvem
          const missing = DEFAULT_SERVICES.filter(def => !services.some(curr => curr.id === def.id));
          if (missing.length > 0) {
            const merged = [...services, ...missing];
            localStorage.setItem("jp_services_library", JSON.stringify(merged));
            db.saveLibrary(merged).catch(e => console.error("Erro ao mesclar biblioteca nova na nuvem:", e));
            return merged;
          }
          localStorage.setItem("jp_services_library", JSON.stringify(services));
          return services;
        } else {
          // Semear tabela Supabase vazia
          await db.saveLibrary(DEFAULT_SERVICES);
          return DEFAULT_SERVICES;
        }
      } catch (e) {
        console.error("Erro Supabase getLibrary, usando local:", e);
      }
    } else if (provider === "sheets") {
      const url = getApiUrl();
      if (url) {
        try {
          const res = await fetchWithTimeout(`${url}?action=getLibrary`);
          const services = await res.json();
          if (Array.isArray(services) && services.length > 0) {
            const missing = DEFAULT_SERVICES.filter(def => !services.some(curr => curr.id === def.id));
            if (missing.length > 0) {
              const merged = [...services, ...missing];
              localStorage.setItem("jp_services_library", JSON.stringify(merged));
              db.saveLibrary(merged).catch(e => console.error("Erro ao mesclar biblioteca nova na nuvem:", e));
              return merged;
            }
            localStorage.setItem("jp_services_library", JSON.stringify(services));
            return services;
          }
        } catch (e) {
          console.error("Erro ao carregar biblioteca da nuvem, usando local", e);
        }
      }
    }
    
    try {
      const data = localStorage.getItem("jp_services_library");
      return data ? JSON.parse(data) : DEFAULT_SERVICES;
    } catch (e) {
      return DEFAULT_SERVICES;
    }
  },

  saveLibrary: async (services) => {
    localStorage.setItem("jp_services_library", JSON.stringify(services));
    const provider = getSyncProvider();
    
    if (provider === "supabase") {
      try {
        await fetchSupabase("services", {
          method: "POST",
          headers: {
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(services.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            defaultText: s.defaultText,
            unit: s.unit || "m²",
            unitPrice: s.unitPrice !== undefined ? Number(s.unitPrice) : 0,
            active: s.active !== undefined ? s.active : true
          })))
        });
        return true;
      } catch (e) {
        console.error("Erro Supabase saveLibrary:", e);
        return false;
      }
    } else if (provider === "sheets") {
      const url = getApiUrl();
      if (url) {
        try {
          await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "saveLibrary", services })
          });
          return true;
        } catch (e) {
          console.error("Erro ao sincronizar biblioteca na nuvem", e);
          return false;
        }
      }
    }
    return true;
  },

  resetLibrary: async () => {
    localStorage.setItem("jp_services_library", JSON.stringify(DEFAULT_SERVICES));
    const provider = getSyncProvider();
    
    if (provider === "supabase") {
      try {
        // Deletar todos os itens da biblioteca no Supabase
        await fetchSupabase("services?id=neq.dummy", {
          method: "DELETE"
        });
        // Reinserir os padrões
        await db.saveLibrary(DEFAULT_SERVICES);
      } catch (e) {
        console.error("Erro Supabase resetLibrary:", e);
      }
    } else if (provider === "sheets") {
      const url = getApiUrl();
      if (url) {
        try {
          await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "saveLibrary", services: DEFAULT_SERVICES })
          });
        } catch (e) {
          console.error("Erro ao resetar biblioteca na nuvem", e);
        }
      }
    }
    return DEFAULT_SERVICES;
  },

  // --- Orçamentos ---
  getBudgets: async () => {
    const provider = getSyncProvider();
    if (provider === "supabase") {
      try {
        const res = await fetchSupabase("budgets?select=*&order=id.asc");
        const budgets = await res.json();
        if (Array.isArray(budgets)) {
          const localData = localStorage.getItem("jp_budgets");
          if (localData) {
            try {
              const parsedLocal = JSON.parse(localData);
              if (parsedLocal.length > 0 && budgets.length === 0) {
                // Backup e proteção contra perda
                localStorage.setItem("jp_budgets_backup", localData);
                return parsedLocal;
              }
            } catch (err) {
              console.error("Erro no guard do getBudgets:", err);
            }
          }
          localStorage.setItem("jp_budgets", JSON.stringify(budgets));
          return budgets;
        }
      } catch (e) {
        console.error("Erro Supabase getBudgets, usando local:", e);
      }
    } else if (provider === "sheets") {
      const url = getApiUrl();
      if (url) {
        try {
          const res = await fetchWithTimeout(`${url}?action=getBudgets`);
          const budgets = await res.json();
          if (Array.isArray(budgets)) {
            const localData = localStorage.getItem("jp_budgets");
            if (localData) {
              try {
                const parsedLocal = JSON.parse(localData);
                if (parsedLocal.length > 0 && budgets.length === 0) {
                  localStorage.setItem("jp_budgets_backup", localData);
                  return parsedLocal;
                }
              } catch (err) {
                console.error("Erro no guard do getBudgets (sheets):", err);
              }
            }
            localStorage.setItem("jp_budgets", JSON.stringify(budgets));
            return budgets;
          }
        } catch (e) {
          console.error("Erro ao carregar orçamentos da nuvem, usando local", e);
        }
      }
    }
    
    try {
      const data = localStorage.getItem("jp_budgets");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getBudget: async (id) => {
    const budgets = await db.getBudgets();
    return budgets.find(b => b.id === id) || null;
  },

  saveBudget: async (budget) => {
    const budgets = await db.getBudgets();
    const index = budgets.findIndex(b => b.id === budget.id);
    
    const budgetToSave = {
      ...budget,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      budgets[index] = budgetToSave;
    } else {
      budgetToSave.createdAt = new Date().toISOString();
      budgets.push(budgetToSave);
    }

    localStorage.setItem("jp_budgets", JSON.stringify(budgets));

    const provider = getSyncProvider();
    if (provider === "supabase") {
      try {
        await fetchSupabase("budgets", {
          method: "POST",
          headers: {
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify({
            id: budgetToSave.id,
            client: budgetToSave.client,
            date: budgetToSave.date,
            status: budgetToSave.status,
            services: budgetToSave.services,
            environments: budgetToSave.environments || [],
            duration: budgetToSave.duration || "",
            payment: budgetToSave.payment || "",
            value: String(budgetToSave.value),
            refDays: budgetToSave.refDays || "",
            refTeam: budgetToSave.refTeam || "",
            notes: budgetToSave.notes || "",
            created_at: budgetToSave.createdAt || new Date().toISOString(),
            updated_at: budgetToSave.updatedAt || new Date().toISOString()
          })
        });
        return budgetToSave;
      } catch (e) {
        console.error("Erro Supabase saveBudget:", e);
      }
    } else if (provider === "sheets") {
      const url = getApiUrl();
      if (url) {
        try {
          const response = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "saveBudget", budget: budgetToSave })
          });
          const resData = await response.json();
          if (resData && resData.success) {
            return budgetToSave;
          }
        } catch (e) {
          console.error("Erro ao salvar orçamento na nuvem", e);
        }
      }
    }
    return budgetToSave;
  },

  deleteBudget: async (id) => {
    const budgets = await db.getBudgets();
    const filtered = budgets.filter(b => b.id !== id);
    localStorage.setItem("jp_budgets", JSON.stringify(filtered));

    const provider = getSyncProvider();
    if (provider === "supabase") {
      try {
        await fetchSupabase(`budgets?id=eq.${id}`, {
          method: "DELETE"
        });
        return true;
      } catch (e) {
        console.error("Erro Supabase deleteBudget:", e);
        return false;
      }
    } else if (provider === "sheets") {
      const url = getApiUrl();
      if (url) {
        try {
          await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "deleteBudget", id })
          });
          return true;
        } catch (e) {
          console.error("Erro ao deletar orçamento na nuvem", e);
          return false;
        }
      }
    }
    return true;
  },

  getNextBudgetId: async () => {
    let budgets = [];
    try {
      const data = localStorage.getItem("jp_budgets");
      budgets = data ? JSON.parse(data) : [];
    } catch (e) {
      budgets = [];
    }
    
    if (budgets.length === 0) {
      return "ORÇ-0001";
    }
    
    const numbers = budgets.map(b => {
      const match = b.id.match(/ORÇ-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const maxNum = Math.max(...numbers, 0);
    const nextNum = maxNum + 1;
    return `ORÇ-${String(nextNum).padStart(4, "0")}`;
  },

  duplicateBudget: async (id) => {
    try {
      const sourceBudget = await db.getBudget(id);
      if (!sourceBudget) return null;

      const nextId = await db.getNextBudgetId();
      const duplicated = {
        ...sourceBudget,
        id: nextId,
        date: new Date().toISOString().split("T")[0],
        status: "Em elaboração",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
          ...sourceBudget.client,
          name: `${sourceBudget.client.name} (Cópia)`
        }
      };

      await db.saveBudget(duplicated);
      return duplicated;
    } catch (e) {
      console.error("Erro ao duplicar orçamento", e);
      return null;
    }
  },

  migrateSheetsToSupabase: async () => {
    const url = getApiUrl();
    if (!url) throw new Error("URL do Google Sheets não encontrada.");

    const resBudgets = await fetchWithTimeout(`${url}?action=getBudgets`, { timeout: 15000 });
    const sheetsBudgets = await resBudgets.json();

    const resLib = await fetchWithTimeout(`${url}?action=getLibrary`, { timeout: 15000 });
    const sheetsLib = await resLib.json();

    if (!Array.isArray(sheetsBudgets) && !Array.isArray(sheetsLib)) {
      throw new Error("Não foi possível carregar os dados do Google Sheets.");
    }

    if (Array.isArray(sheetsLib) && sheetsLib.length > 0) {
      await db.saveLibrary(sheetsLib);
    }

    let successCount = 0;
    if (Array.isArray(sheetsBudgets)) {
      for (const b of sheetsBudgets) {
        await db.saveBudget(b);
        successCount++;
      }
    }
    return successCount;
  }
};
