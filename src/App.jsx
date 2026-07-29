import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BudgetForm from './components/BudgetForm';
import ServicesSelector from './components/ServicesSelector';
import PdfPreview from './components/PdfPreview';
import LibraryManager from './components/LibraryManager';
import HistoryList from './components/HistoryList';
import { db } from './services/db';
import { Eye, Edit, CheckCircle, AlertCircle, PlusCircle, Save, History, Settings, Share2, ChevronDown, FileText, Upload } from 'lucide-react';
import html2canvas from 'html2canvas-pro';

const JULIO_PHONE = "5547999173996";

// Função auxiliar para clonar estilos e fontes para o iframe do html2canvas, prevenindo perda de estilo no Safari/iOS
const prepareCloneStyles = (clonedDoc) => {
  const head = clonedDoc.head;
  
  // Limpar estilos duplicados no clone
  head.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
  
  // 1. Inserir estilos como CSS embutido direto dos stylesheets ativos (método mais rápido e seguro)
  let cssText = '';
  let readSuccess = false;
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            cssText += rules[j].cssText + '\n';
          }
          readSuccess = true;
        }
      } catch (sheetErr) {
        // Ignorar erros de CORS em stylesheets externas
      }
    }
  } catch (err) {
    console.warn("Erro ao ler regras CSS dos stylesheets:", err);
  }
  
  if (readSuccess && cssText) {
    const styleElement = clonedDoc.createElement('style');
    styleElement.textContent = cssText;
    head.appendChild(styleElement);
  } else {
    // 2. Fallback: Copiar tags originais garantindo caminhos absolutos (para iframe about:blank)
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(style => {
      const clonedStyle = style.cloneNode(true);
      if (clonedStyle.tagName === 'LINK' && style.href) {
        clonedStyle.href = style.href; // Força URL absoluta
      }
      head.appendChild(clonedStyle);
    });
  }

  // 3. Copiar fontes do documento principal para o clonado
  if (document.fonts) {
    document.fonts.forEach(font => {
      try {
        clonedDoc.fonts.add(font);
      } catch (e) {
        console.error("Erro ao copiar fonte:", e);
      }
    });
  }
};

export default function App() {
  const [library, setLibrary] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [budget, setBudget] = useState(null);
  
  // Controle de Modais
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [printOnlyPage1, setPrintOnlyPage1] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInstructions, setImportInstructions] = useState('');
  const [selectedImportFiles, setSelectedImportFiles] = useState([]);

  // Tab ativa no mobile (Editor vs PDF)
  const [activeMobileTab, setActiveMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [currentStep, setCurrentStep] = useState(1);
  const [isSendMenuOpen, setIsSendMenuOpen] = useState(false);
  const sendDropdownRef = useRef(null);

  const getStepName = (step) => {
    switch (step) {
      case 1: return "Informações";
      case 2: return "Dados do Cliente";
      case 3: return "Valores e Condições";
      case 4: return "Serviços: Preparação";
      case 5: return "Serviços: Pintura";
      case 6: return "Serviços: Revestimentos";
      case 7: return "Serviços: Efeitos Decorativos";
      case 8: return "Serviços: Equipamentos";
      default: return "";
    }
  };

  const editorScrollRef = useRef(null);

  useEffect(() => {
    if (editorScrollRef.current) {
      editorScrollRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  // Notificações Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Controle de Visualização do Cliente
  const [viewId, setViewId] = useState(null);
  const [clientBudget, setClientBudget] = useState(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Carregar dados iniciais
  useEffect(() => {
    const initData = async () => {
      // Checar se estamos na visualização do cliente (link externo)
      const queryParams = new URLSearchParams(window.location.search);
      const view = queryParams.get('view');
      if (view) {
        setViewId(view);
        setLoadingClient(true);
        try {
          const b = await db.getBudget(view);
          setClientBudget(b);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingClient(false);
        }
        return; // Evita carregar dados do painel de administração
      }

      try {
        const cachedLib = localStorage.getItem("jp_services_library");
        const cachedBudg = localStorage.getItem("jp_budgets");

        const initialLib = cachedLib ? JSON.parse(cachedLib) : [];
        const initialBudg = cachedBudg ? JSON.parse(cachedBudg) : [];

        if (initialLib.length > 0) {
          setLibrary(initialLib);
        } else {
          const lib = await db.getLibrary();
          setLibrary(lib);
        }

        if (initialBudg.length > 0) {
          setBudgets(initialBudg);
        } else {
          const budg = await db.getBudgets();
          setBudgets(budg);
        }
        
        // Inicializar com orçamento em branco
        const nextId = await db.getNextBudgetId();
        setBudget(createEmptyBudget(nextId));

        // Sincronizar em segundo plano se já carregou o cache
        if (initialLib.length > 0) {
          db.getLibrary().then(cloudLib => {
            if (cloudLib && cloudLib.length > 0) {
              setLibrary(cloudLib);
            }
          }).catch(e => console.error("Erro sincronizar lib", e));
        }

        if (initialBudg.length > 0) {
          db.getBudgets().then(cloudBudg => {
            if (cloudBudg) {
              setBudgets(cloudBudg);
            }
          }).catch(e => console.error("Erro sincronizar orcamentos", e));
        }

        // Verificação automática de migração pendente no primeiro carregamento
        const localBudgetsRaw = localStorage.getItem("jp_budgets");
        if (localBudgetsRaw) {
          const localBudgets = JSON.parse(localBudgetsRaw);
          const isMigrated = localStorage.getItem("jp_migrated_to_cloud") === "true";
          
          if (localBudgets.length > 0 && !isMigrated) {
            const confirmMigration = confirm(
              `Olá!! Detectamos que voce possui ${localBudgets.length} orçamentoss salvos localmente neste aparelho. A partir de agora vamos salvar também em nuvem para que você podssa acessar de outros dispositivos e ficar permanentemente sincronizado, ok?`
            );
            
            if (confirmMigration) {
              showToast("Sincronizando dados locais com a nuvem...");
              for (const b of localBudgets) {
                await db.saveBudget(b);
              }
              localStorage.setItem("jp_migrated_to_cloud", "true");
              const freshBudgets = await db.getBudgets();
              setBudgets(freshBudgets);
              showToast("Sincronização concluída com sucesso!");
            } else {
              // Se recusar, marca como migrado para não exibir o aviso novamente
              localStorage.setItem("jp_migrated_to_cloud", "true");
            }
          }
        }
      } catch (err) {
        console.error("Erro ao inicializar dados:", err);
      }
    };
    initData();
  }, []);

  // Monitorar fechamento da caixa de impressão para restaurar exibição completa
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintOnlyPage1(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Fechar dropdown de envio do mobile se clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sendDropdownRef.current && !sendDropdownRef.current.contains(event.target)) {
        setIsSendMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const createEmptyBudget = (id) => {
    return {
      id: id,
      client: {
        name: '',
        phone: '',
        address: '',
        city: '',
        notes: ''
      },
      date: new Date().toISOString().split('T')[0],
      status: 'Em elaboração',
      services: [],
      duration: '1 semana',
      payment: '50% entrada + 50% conclusão',
      value: '',
      refDays: '',
      refTeam: '',
      notes: '• Inclusos todos os materiais de preparação, tintas de acabamento, lixas, fitas e lonas de proteção.\n• O cliente fornecerá ponto de água e energia elétrica.\n• Limpeza final pós-obra inclusa.\n• Validade desta proposta: 15 dias.'
    };
  };

  // Ações do Cabeçalho
  const handleNewBudget = async () => {
    if (confirm("Deseja limpar os campos atuais e iniciar um novo orçamento?")) {
      const nextId = await db.getNextBudgetId();
      setBudget(createEmptyBudget(nextId));
      setActiveMobileTab('editor');
      setCurrentStep(1);
      showToast("Novo orçamento iniciado");
    }
  };

  const handleServicesChange = (services) => {
    const updatedServices = services.map(s => {
      const qty = parseFloat(s.quantity);
      const price = parseFloat(s.unitPrice);
      if (!isNaN(qty) && !isNaN(price)) {
        return {
          ...s,
          subtotal: parseFloat((qty * price).toFixed(2))
        };
      }
      return s;
    });

    const hasQuantities = updatedServices.some(s => (parseFloat(s.quantity) || 0) > 0);
    let newValue = budget.value;
    
    if (hasQuantities) {
      const sum = updatedServices.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
      newValue = String(sum);
    }
    
    setBudget({
      ...budget,
      services: updatedServices,
      value: newValue
    });
  };

  const triggerPDFImport = () => {
    setIsImportModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedImportFiles(prev => [...prev, ...files]);
    }
  };

  const handleImportPDF = async (files, instructions = '') => {
    const geminiKey = localStorage.getItem("jp_gemini_api_key");
    if (!geminiKey) {
      showToast("Por favor, configure sua chave do Gemini nas Configurações (Itens) para importar PDFs.", "error");
      setIsLibraryOpen(true);
      return;
    }

    const filesArray = Array.isArray(files) ? files : [files];

    setIsImporting(true);
    showToast(`Lendo ${filesArray.length} arquivo(s) PDF...`, "info");

    try {
      // Converte todos os arquivos para base64
      const base64Files = await Promise.all(
        filesArray.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              mimeType: file.type || 'application/pdf',
              data: reader.result.split(',')[1],
              name: file.name
            });
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        })
      );

      showToast("IA interpretando projetos e especificações...", "info");

      // Passar catálogo de itens no prompt
      const catalogText = library
        .filter(item => item.active)
        .map(item => `ID: "${item.id}" | Nome: "${item.name}" | Categoria: "${item.category}" | Unidade padrão: "${item.unit || 'm²'}" | Preço padrão: ${item.unitPrice || 0}`)
        .join("\n");

      const prompt = `
Você é o assistente técnico de orçamentos do pintor profissional Júlio Peixer.
Analise detalhadamente os arquivos de projeto arquitetônico/interiores e especificações técnicos em anexo (especialmente no que tange a acabamento de paredes, tetos, pinturas, cores, paginações e notas técnicas). Você recebeu ${filesArray.length} arquivo(s). Integre todas as informações para montar o orçamento final.

Você deve identificar todos os ambientes/cômodos (ex: Cozinha, Suíte Master, etc.) com suas respectivas áreas, pé-direito, tintas especificadas, observações de acabamento e serviços necessários.

${instructions ? `DIRETRIZES IMPORTANTES DO USUÁRIO QUE VOCÊ DEVE SEGUIR À RISCA:
"${instructions}"\n` : ''}
IMPORTANTE: 
1. Mapeie cada serviço necessário para um item do nosso catálogo de serviços.
2. NÃO INVENTE IDs de serviço. Use estritamente e somente os IDs fornecidos no catálogo abaixo.
3. Se um ambiente não especificar tintas ou tiver superfícies revestidas, marque as observações e deduza as áreas de acordo.
4. Em caso de dúvidas sobre medidas ou especificações que não estejam no PDF, utilize a observação "Conferir em obra". Nunca assuma medidas inexistentes.

Aqui está o catálogo de serviços ativos no sistema:
${catalogText}

Retorne um objeto JSON estritamente no formato abaixo, sem qualquer formatação markdown (como blocos de código \`\`\`json):
{
  "client": {
    "name": "Nome do cliente se identificado",
    "phone": "Telefone se identificado",
    "address": "Endereço da obra se identificado",
    "city": "Cidade se identificada"
  },
  "environments": [
    {
      "name": "Nome do Ambiente (ex: Cozinha)",
      "area": 25.4, 
      "height": 2.7, 
      "finishes": "Descrição resumida dos acabamentos do ambiente (ex: Pintura fosca, concreto aparente, porcelanato)",
      "paints": [
        "Paredes: Suvinil Meditação Fosco",
        "Teto: Suvinil Branco Neve Fosco"
      ],
      "observations": [
        "Descontar áreas de marcenaria",
        "Descontar revestimentos"
      ],
      "services": [
        {
          "serviceId": "prep-isolamento-piso",
          "quantity": 25.4
        },
        {
          "serviceId": "pint-tinta-fosca-interna",
          "quantity": 68.5 
        }
      ]
    }
  ],
  "generalObservations": [
    "confirmar medidas na obra",
    "realizar teste de cor",
    "considerar reparos após instalação da iluminação",
    "considerar reparos após instalação da marcenaria"
  ]
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash-lite:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              ...base64Files.map(bFile => ({
                inlineData: {
                  mimeType: bFile.mimeType,
                  data: bFile.data
                }
              }))
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        let errMsg = response.statusText || `Código ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error && errJson.error.message) {
            errMsg = errJson.error.message;
          }
        } catch (e) {}
        throw new Error(`Erro na API do Gemini: ${errMsg}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error("Resposta da IA vazia ou inválida.");
      }

      // Limpeza robusta do JSON retornado pela IA para evitar erros de sintaxe (como comentários ou vírgulas extras)
      let cleanedText = rawText.trim();
      cleanedText = cleanedText.replace(/^```(?:json)?/gi, '').replace(/```$/g, '').trim();
      cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1');

      const parsed = JSON.parse(cleanedText);

      // Construir orçamento a partir do retorno
      await buildBudgetFromImport(parsed);
      showToast("Projeto importado e orçamento gerado com sucesso!");
    } catch (err) {
      console.error(err);
      showToast(`Erro ao importar projeto: ${err.message}`, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const buildBudgetFromImport = async (parsedData) => {
    const nextId = await db.getNextBudgetId();
    
    // Mapear os serviços e calcular totais
    const servicesMap = {};
    
    parsedData.environments?.forEach(env => {
      env.services?.forEach(s => {
        const item = library.find(l => l.id === s.serviceId);
        if (!item) return; // ignora inválidos
        
        if (!servicesMap[s.serviceId]) {
          servicesMap[s.serviceId] = {
            id: item.id,
            name: item.name,
            category: item.category,
            text: item.defaultText,
            unit: item.unit || 'm²',
            unitPrice: item.unitPrice || 0,
            quantity: 0
          };
        }
        servicesMap[s.serviceId].quantity += parseFloat(s.quantity) || 0;
      });
    });

    const budgetServices = Object.values(servicesMap).map(s => {
      s.quantity = parseFloat(s.quantity.toFixed(2));
      s.subtotal = parseFloat((s.quantity * s.unitPrice).toFixed(2));
      return s;
    });

    const totalValue = budgetServices.reduce((sum, s) => sum + s.subtotal, 0);

    const notesArray = parsedData.generalObservations || [];
    const formattedNotes = notesArray.map(obs => `• ${obs}`).join('\n') || 
                           '• Inclusos todos os materiais de preparação, tintas de acabamento, lixas, fitas e lonas de proteção.\n• O cliente fornecerá ponto de água e energia elétrica.\n• Limpeza final pós-obra inclusa.\n• Validade desta proposta: 15 dias.';

    const newBudget = {
      id: nextId,
      client: {
        name: parsedData.client?.name || '',
        phone: parsedData.client?.phone || '',
        address: parsedData.client?.address || '',
        city: parsedData.client?.city || '',
        notes: parsedData.client?.notes || ''
      },
      date: new Date().toISOString().split('T')[0],
      status: 'Em elaboração',
      services: budgetServices,
      environments: parsedData.environments || [],
      duration: '2 semanas',
      payment: '50% entrada + 50% conclusão',
      value: String(totalValue),
      refDays: '',
      refTeam: '',
      notes: formattedNotes
    };

    setBudget(newBudget);
    setCurrentStep(1);
    setActiveMobileTab('editor');
  };

  const handleSaveBudget = async () => {
    if (!budget.client.name.trim()) {
      showToast("Por favor, informe pelo menos o Nome do Cliente para salvar.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await db.saveBudget(budget);
      if (saved) {
        const updatedBudgets = await db.getBudgets();
        setBudgets(updatedBudgets);
        showToast(`Orçamento ${budget.id} salvo com sucesso!`);
      } else {
        showToast("Ocorreu um erro ao salvar o orçamento.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao conectar ao banco de dados.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Altera o status do orçamento para "Enviado" (se já não estiver Aprovado ou Enviado) ao realizar uma ação de Envio/Cópia
  const markAsSentIfNeeded = async () => {
    if (budget && budget.status !== 'Aprovado' && budget.status !== 'Enviado') {
      const updatedBudget = {
        ...budget,
        status: 'Enviado'
      };
      setBudget(updatedBudget);
      try {
        const saved = await db.saveBudget(updatedBudget);
        if (saved) {
          const updatedBudgets = await db.getBudgets();
          setBudgets(updatedBudgets);
        }
      } catch (err) {
        console.error("Erro ao salvar status de enviado:", err);
      }
    }
  };

  const handlePrintPage1 = () => {
    if (!budget.client.name.trim()) {
      showToast("Aviso: Salve ou insira o nome do cliente antes de imprimir.", "error");
    }
    setPrintOnlyPage1(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintFull = () => {
    if (!budget.client.name.trim()) {
      showToast("Aviso: Salve ou insira o nome do cliente antes de imprimir.", "error");
    }
    setPrintOnlyPage1(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Operações de Histórico
  const handleLoadBudget = (loadedBudget) => {
    setBudget(loadedBudget);
    setIsHistoryOpen(false);
    setActiveMobileTab('preview'); // Abre na prévia para visualização
    setCurrentStep(1);
    showToast(`Orçamento ${loadedBudget.id} carregado`);
  };

  const handleDuplicateBudget = async (id) => {
    const duplicated = await db.duplicateBudget(id);
    if (duplicated) {
      const updatedBudgets = await db.getBudgets();
      setBudgets(updatedBudgets);
      setBudget(duplicated);
      setIsHistoryOpen(false);
      showToast(`Orçamento duplicado como ${duplicated.id}`);
    } else {
      showToast("Erro ao duplicar orçamento.", "error");
    }
  };

  const handleDeleteBudget = async (id) => {
    if (confirm(`Excluir permanentemente o orçamento ${id}?`)) {
      const success = await db.deleteBudget(id);
      if (success) {
        const updatedBudgets = await db.getBudgets();
        setBudgets(updatedBudgets);
        showToast(`Orçamento ${id} excluído`);
        
        // Se o orçamento apagado era o atual, inicia um novo em branco
        if (budget.id === id) {
          const nextId = await db.getNextBudgetId();
          setBudget(createEmptyBudget(nextId));
        }
      }
    }
  };

  // Carregar orçamento direto no PDF a partir do Histórico e imprimir
  const handlePrintDirect = (budgetToPrint) => {
    setBudget(budgetToPrint);
    setIsHistoryOpen(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Biblioteca Global
  const handleSaveLibrary = async (newLibrary) => {
    const success = await db.saveLibrary(newLibrary);
    if (success) {
      setLibrary(newLibrary);
      showToast("Biblioteca de serviços atualizada");
    } else {
      showToast("Erro ao salvar biblioteca.", "error");
    }
  };

  // Clipboard: Copiar Página 1 como Imagem (Padrão síncrono c/ Promise p/ Safari/iOS)
  const handleCopyPage1 = async () => {
    markAsSentIfNeeded();
    const el = document.querySelector('#pdf-hidden-capture #pdf-page-1');
    if (!el) {
      showToast("Página do PDF não encontrada.", "error");
      return;
    }
    
    showToast("Gerando imagem da Página 1...");
    try {
      const clipboardItem = new ClipboardItem({
        "image/png": new Promise((resolve, reject) => {
          html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
              prepareCloneStyles(clonedDoc);
              const fullDoc = clonedDoc.getElementById('pdf-full-document');
              if (fullDoc) {
                fullDoc.classList.remove('screen-preview-zoom');
                fullDoc.style.transform = 'none';
                fullDoc.style.zoom = 'normal';
                fullDoc.style.width = '210mm';
                fullDoc.style.maxWidth = '210mm';
                fullDoc.style.marginBottom = '0';
              }
              const page1 = clonedDoc.getElementById('pdf-page-1');
              if (page1) {
                page1.classList.remove('screen-preview-zoom');
                page1.style.transform = 'none';
                page1.style.zoom = 'normal';
                page1.style.width = '210mm';
                page1.style.maxWidth = '210mm';
                page1.style.marginBottom = '0';
              }
              const wrappers = clonedDoc.querySelectorAll('.preview-scale-wrapper');
              wrappers.forEach(wrap => {
                wrap.style.width = 'auto';
                wrap.style.margin = '0';
              });
            }
          }).then(canvas => {
            canvas.toBlob(blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Erro ao gerar blob da imagem"));
              }
            }, 'image/png');
          }).catch(err => reject(err));
        })
      });

      await navigator.clipboard.write([clipboardItem]);
      showToast("Página 1 copiada! Vá ao WhatsApp e cole.");
    } catch (err) {
      console.error(err);
      showToast("Erro de permissão ou suporte no navegador. Tente pelo computador ou use Enviar Link.", "error");
    }
  };

  // Clipboard: Copiar Documento Completo como Imagem (Padrão síncrono c/ Promise p/ Safari/iOS)
  const handleCopyFull = async () => {
    markAsSentIfNeeded();
    const el = document.querySelector('#pdf-hidden-capture #pdf-full-document');
    if (!el) {
      showToast("Documento do PDF não encontrado.", "error");
      return;
    }

    showToast("Gerando imagem completa...");
    try {
      const clipboardItem = new ClipboardItem({
        "image/png": new Promise((resolve, reject) => {
          html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
              prepareCloneStyles(clonedDoc);
              const fullDoc = clonedDoc.getElementById('pdf-full-document');
              if (fullDoc) {
                fullDoc.classList.remove('screen-preview-zoom');
                fullDoc.style.transform = 'none';
                fullDoc.style.zoom = 'normal';
                fullDoc.style.width = '210mm';
                fullDoc.style.maxWidth = '210mm';
                fullDoc.style.marginBottom = '0';
              }
              const page1 = clonedDoc.getElementById('pdf-page-1');
              if (page1) {
                page1.classList.remove('screen-preview-zoom');
                page1.style.transform = 'none';
                page1.style.zoom = 'normal';
                page1.style.width = '210mm';
                page1.style.maxWidth = '210mm';
                page1.style.marginBottom = '0';
              }
              const wrappers = clonedDoc.querySelectorAll('.preview-scale-wrapper');
              wrappers.forEach(wrap => {
                wrap.style.width = 'auto';
                wrap.style.margin = '0';
              });
            }
          }).then(canvas => {
            canvas.toBlob(blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Erro ao gerar blob da imagem completa"));
              }
            }, 'image/png');
          }).catch(err => reject(err));
        })
      });

      await navigator.clipboard.write([clipboardItem]);
      showToast("Proposta completa copiada! Vá ao WhatsApp e cole.");
    } catch (err) {
      console.error(err);
      showToast("Erro de permissão ou suporte no navegador. Tente pelo computador ou use Enviar Link.", "error");
    }
  };

  const generateWhatsAppText = (b) => {
    const categories = ["PREPARAÇÃO", "PINTURA", "REVESTIMENTOS", "EFEITOS DECORATIVOS", "EQUIPAMENTOS E DIFERENCIAIS"];
    const formatCurrency = (val) => {
      const num = parseFloat(val) || 0;
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    let text = `*🎨 JÚLIO PEIXER PINTURAS*\n`;
    text += `*Orçamento:* _${b.id}_\n`;
    text += `*Cliente:* ${b.client.name || 'Não informado'}\n`;
    if (b.client.phone) text += `*Telefone:* ${b.client.phone}\n`;
    if (b.client.address) text += `*Local da Obra:* ${b.client.address}${b.client.city ? `, ${b.client.city}` : ''}\n`;
    text += `\n*SERVIÇOS PROPOSTOS:*\n`;

    categories.forEach(cat => {
      const services = b.services?.filter(s => s.category === cat) || [];
      if (services.length > 0) {
        text += `\n*${cat}*\n`;
        services.forEach(s => {
          text += `• *${s.name}*\n`;
        });
      }
    });

    text += `\n---------------------------------\n`;
    text += `*💵 Investimento Total:* ${formatCurrency(b.value)}\n`;
    text += `*📅 Prazo Estimado:* ${b.duration || 'Não informado'}\n`;
    text += `*💳 Pagamento:* ${b.payment || 'Não informado'}\n`;

    if (b.notes) {
      const cleanNotes = b.notes.replace(/•/g, '-').trim();
      text += `\n*Observações e Termos:*\n_${cleanNotes}_\n`;
    }

    text += `\n_Qualidade, Segurança, Tecnologia e Compromisso_`;
    return text;
  };

  // Clipboard: Copiar Resumo como Texto do WhatsApp
  const handleCopyText = () => {
    markAsSentIfNeeded();
    const text = generateWhatsAppText(budget);
    try {
      navigator.clipboard.writeText(text);
      showToast("Resumo formatado copiado! Vá ao WhatsApp e cole.");
    } catch (err) {
      console.error(err);
      showToast("Erro ao copiar o texto.", "error");
    }
  };

  // WhatsApp: Enviar texto preenchido direto ao número do cliente
  const handleSendWhatsAppText = () => {
    markAsSentIfNeeded();
    if (!budget.client.phone) {
      showToast("Por favor, preencha o telefone do cliente para enviar.", "error");
      return;
    }
    
    // Limpar o número de telefone do cliente
    let cleanedPhone = budget.client.phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10 || cleanedPhone.length === 11) {
      cleanedPhone = '55' + cleanedPhone;
    } else if (!cleanedPhone.startsWith('55') && cleanedPhone.length >= 8) {
      cleanedPhone = '55' + cleanedPhone;
    }

    const text = generateWhatsAppText(budget);
    const url = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp/Mobile Share: Compartilhar imagem da proposta diretamente por apps
  const handleShareImage = async () => {
    markAsSentIfNeeded();
    const el = document.querySelector('#pdf-hidden-capture #pdf-page-1');
    if (!el) {
      showToast("Página da proposta não encontrada.", "error");
      return;
    }

    showToast("Preparando imagem para compartilhar...");
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          prepareCloneStyles(clonedDoc);
          const fullDoc = clonedDoc.getElementById('pdf-full-document');
          if (fullDoc) {
            fullDoc.classList.remove('screen-preview-zoom');
            fullDoc.style.transform = 'none';
            fullDoc.style.zoom = 'normal';
            fullDoc.style.width = '210mm';
            fullDoc.style.maxWidth = '210mm';
            fullDoc.style.marginBottom = '0';
          }
          const page1 = clonedDoc.getElementById('pdf-page-1');
          if (page1) {
            page1.classList.remove('screen-preview-zoom');
            page1.style.transform = 'none';
            page1.style.zoom = 'normal';
            page1.style.width = '210mm';
            page1.style.maxWidth = '210mm';
            page1.style.marginBottom = '0';
          }
          const wrappers = clonedDoc.querySelectorAll('.preview-scale-wrapper');
          wrappers.forEach(wrap => {
            wrap.style.width = 'auto';
            wrap.style.margin = '0';
          });
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast("Erro ao processar imagem.", "error");
          return;
        }

        const file = new File([blob], `orcamento-${budget.id}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Orçamento Júlio Peixer - ${budget.id}`,
              text: `Olá! Segue em anexo a proposta comercial do orçamento ${budget.id}.`
            });
          } catch (shareErr) {
            console.log("Compartilhamento cancelado", shareErr);
          }
        } else {
          // Fallback para Clipboard se o navegador/aparelho não suportar compartilhamento de arquivos
          try {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            showToast("Compartilhamento direto indisponível. Imagem copiada! Vá ao WhatsApp e cole.");
          } catch (clipErr) {
            console.error(clipErr);
            showToast("Erro ao copiar imagem.", "error");
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      showToast("Erro ao gerar a imagem.", "error");
    }
  };

  const handleCopyClientLink = () => {
    markAsSentIfNeeded();
    const clientUrl = `${window.location.origin}${window.location.pathname}?view=${budget.id}`;
    const text = `Olá ${budget.client.name || ''}, segue o link exclusivo para visualizar a proposta comercial do seu orçamento:\n\n🔗 ${clientUrl}\n\nQualquer dúvida, estou à disposição!`;
    try {
      navigator.clipboard.writeText(text);
      showToast("Mensagem e link copiados!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao copiar a mensagem.", "error");
    }
  };

  const handleSendWhatsAppLink = () => {
    markAsSentIfNeeded();
    if (!budget.client.phone) {
      showToast("Por favor, preencha o telefone do cliente para enviar.", "error");
      return;
    }

    let cleanedPhone = budget.client.phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10 || cleanedPhone.length === 11) {
      cleanedPhone = '55' + cleanedPhone;
    } else if (!cleanedPhone.startsWith('55') && cleanedPhone.length >= 8) {
      cleanedPhone = '55' + cleanedPhone;
    }

    const clientUrl = `${window.location.origin}${window.location.pathname}?view=${budget.id}`;
    const text = `Olá ${budget.client.name || ''}, segue o link exclusivo para visualizar a proposta comercial do seu orçamento:\n\n🔗 ${clientUrl}\n\nQualquer dúvida, estou à disposição!`;
    
    const url = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleApproveBudget = async () => {
    if (confirm("Confirmar a aprovação desta proposta comercial?")) {
      const updatedBudget = {
        ...clientBudget,
        status: "Aprovado"
      };
      
      showToast("Enviando aprovação...");
      const saved = await db.saveBudget(updatedBudget);
      if (saved) {
        setClientBudget(updatedBudget);
        showToast("Proposta aprovada! O profissional foi notificado.");
      } else {
        showToast("Erro ao processar aprovação.", "error");
      }
    }
  };

  // --- RENDERIZADOR DA VISUALIZAÇÃO DO CLIENTE (PORTAL EXCLUSIVO) ---
  if (viewId) {
    if (loadingClient) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-28 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-end">
              <div className="absolute bottom-0 left-0 right-0 w-full bg-brand/20 border-t border-brand/50 animate-wallPaintFill"></div>
              <div className="absolute left-1/2 -translate-x-1/2 animate-paintRollUp w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand filter drop-shadow-[0_0_8px_rgba(0,230,184,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="2" width="12" height="6" rx="1" fill="currentColor" />
                  <path d="M15 5h2a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 17 11h-5v5" />
                  <rect x="11" y="16" width="2" height="6" rx="0.5" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold tracking-widest text-brand uppercase animate-pulse">
                Preparando proposta comercial...
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Buscando dados na nuvem</p>
            </div>
          </div>
        </div>
      );
    }

    if (!clientBudget) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-350 font-sans p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Orçamento não encontrado</h2>
          <p className="text-xs text-slate-500 mb-6 max-w-sm">Não encontramos a proposta solicitada. Verifique se o link está correto ou entre em contato com Júlio Peixer Pinturas.</p>
          <a
            href={`https://api.whatsapp.com/send?phone=${JULIO_PHONE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-brand hover:bg-slate-800 transition cursor-pointer"
          >
            Falar no WhatsApp
          </a>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
        {/* CABEÇALHO PORTAL CLIENTE */}
        <header className="no-print glassmorphism sticky top-0 z-40 w-full px-4 md:px-6 py-3 flex items-center justify-between border-b border-slate-800 shadow-lg h-[68px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
              <img src="/logo.png" alt="Logo Júlio Peixer" className="w-full h-full object-cover rounded" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-white leading-tight">Júlio Peixer</h1>
              <p className="text-[9px] md:text-[10px] font-semibold text-brand tracking-widest uppercase leading-tight">Pinturas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {clientBudget.status !== "Aprovado" && (
              <button
                onClick={handleApproveBudget}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 transition cursor-pointer"
              >
                <span>Aprovar Proposta</span>
              </button>
            )}
            
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <span>Imprimir / PDF</span>
            </button>
            
            <a
              href={`https://api.whatsapp.com/send?phone=${JULIO_PHONE}&text=Ol%C3%A1%20J%C3%BAlio%2C%20estou%20visualizando%20o%20or%C3%A7amento%20${clientBudget.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-brand hover:bg-brand-hover text-slate-950 shadow-md shadow-brand/10 transition cursor-pointer"
            >
              <span>Contato WhatsApp</span>
            </a>
          </div>
        </header>

        {/* PROPOSTA COMERCIAL */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/40 flex justify-center items-start">
          <div className="w-full max-w-[210mm] flex justify-center">
            <div className="preview-scale-wrapper">
              <PdfPreview budget={clientBudget} printOnlyPage1={false} />
            </div>
          </div>
        </main>
        
        {/* Notificações Toast do Cliente */}
        {toast && (
          <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border text-xs font-semibold z-50 bg-slate-900/90 border-slate-800 text-brand shadow-slate-950/20 transition-all duration-300">
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-28 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-end">
            <div className="absolute bottom-0 left-0 right-0 w-full bg-brand/20 border-t border-brand/50 animate-wallPaintFill"></div>
            <div className="absolute left-1/2 -translate-x-1/2 animate-paintRollUp w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand filter drop-shadow-[0_0_8px_rgba(0,230,184,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="2" width="12" height="6" rx="1" fill="currentColor" />
                <path d="M15 5h2a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 17 11h-5v5" />
                <rect x="11" y="16" width="2" height="6" rx="0.5" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold tracking-widest text-brand uppercase animate-pulse">
              Preparando tintas...
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Carregando sistema de orçamentos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none text-slate-100">
      
      {/* CABEÇALHO (no-print) */}
      <Header
        onNew={handleNewBudget}
        onSave={handleSaveBudget}
        onImportPDF={triggerPDFImport}
        isImporting={isImporting}
        onPrintPage1={handlePrintPage1}
        onPrintFull={handlePrintFull}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onCopyPage1={handleCopyPage1}
        onCopyFull={handleCopyFull}
        onCopyText={handleCopyText}
        onSendWhatsAppText={handleSendWhatsAppText}
        onShareImage={handleShareImage}
        onSendWhatsAppLink={handleSendWhatsAppLink}
        onCopyClientLink={handleCopyClientLink}
        isSaving={isSaving}
      />

      {/* SELETOR MOBILE EDITOR vs PREVIEW (no-print) */}
      <div className="no-print flex lg:hidden bg-slate-900 border-b border-slate-800 p-2 sticky top-[68px] z-30 gap-1.5">
        <button
          onClick={() => {
            setActiveMobileTab('editor');
            setIsSendMenuOpen(false);
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeMobileTab === 'editor'
              ? 'bg-brand/10 text-brand border border-brand/20'
              : 'text-slate-400'
          }`}
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Editar</span>
        </button>
        
        <button
          onClick={() => {
            handleSaveBudget();
            setActiveMobileTab('preview');
            setIsSendMenuOpen(false);
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeMobileTab === 'preview'
              ? 'bg-brand/10 text-brand border border-brand/20'
              : 'text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver PDF</span>
        </button>

        <button
          onClick={() => {
            handleSaveBudget();
            setIsSendMenuOpen(false);
          }}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-brand" />
          <span>Salvar</span>
        </button>

        <div className="flex-1 relative" ref={sendDropdownRef}>
          <button
            onClick={() => setIsSendMenuOpen(!isSendMenuOpen)}
            className={`w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              isSendMenuOpen
                ? 'bg-brand/10 text-brand border border-brand/20'
                : 'text-slate-400'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-brand" />
            <span>Enviar</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          
          {isSendMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 text-left">
              <div className="px-2 py-0.5 text-[9px] font-bold text-brand uppercase tracking-wider">Enviar por WhatsApp</div>
              
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppLink();
                  setIsSendMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Orçamento Online (Link)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleShareImage();
                  setIsSendMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppText();
                  setIsSendMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              >
                TEXTO
              </button>
              
              <div className="h-px bg-slate-800 my-1"></div>
              <div className="px-2.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Copiar (CTRL+C)</div>
              
              <button
                type="button"
                onClick={() => {
                  handleCopyText();
                  setIsSendMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-355 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Texto
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCopyClientLink();
                  setIsSendMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-355 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Orçamento Online (Link)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL DE TRABALHO */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* COLUNA 1: EDITOR / ENTRADA DE DADOS */}
        <div 
          ref={editorScrollRef}
          className={`no-print w-full lg:w-[48%] xl:w-[45%] h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 flex flex-col justify-start ${
            activeMobileTab === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="space-y-6 flex flex-col justify-start">

            {/* BARRINHAS DE PROGRESSO COMPACTAS NO TOPO */}
            <div className="flex items-center gap-1.5 shrink-0 px-0.5 py-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;
                return (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    type="button"
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer flex-1 ${
                      isActive 
                        ? 'bg-brand shadow-[0_0_8px_rgba(0,230,184,0.4)]' 
                        : isCompleted 
                          ? 'bg-brand/40' 
                          : 'bg-slate-800'
                    }`}
                    title={`Ir para Passo ${step}: ${getStepName(step)}`}
                  />
                );
              })}
            </div>

            {/* SLIDER VIEWPORT */}
            <div className="relative overflow-hidden w-full">
              <div 
                className="flex w-[800%] transition-transform duration-300 ease-in-out items-start"
                style={{ transform: `translateX(-${(currentStep - 1) * 12.5}%)` }}
              >
                {/* Passo 1: Informações do Orçamento */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 1 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <BudgetForm budget={budget} onChange={setBudget} section="info" />
                </div>

                {/* Passo 2: Dados do Cliente */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 2 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <BudgetForm budget={budget} onChange={setBudget} section="client" />
                </div>

                {/* Passo 3: Valores e Condições */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 3 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <BudgetForm budget={budget} onChange={setBudget} section="values" />
                </div>

                {/* Passo 4: Serviços - Preparação */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 4 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <ServicesSelector 
                    library={library} 
                    selectedServices={budget.services} 
                    onChange={handleServicesChange} 
                    filterCategory="PREPARAÇÃO"
                  />
                </div>

                {/* Passo 5: Serviços - Pintura */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 5 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <ServicesSelector 
                    library={library} 
                    selectedServices={budget.services} 
                    onChange={handleServicesChange} 
                    filterCategory="PINTURA"
                  />
                </div>

                {/* Passo 6: Serviços - Revestimentos */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 6 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <ServicesSelector 
                    library={library} 
                    selectedServices={budget.services} 
                    onChange={handleServicesChange} 
                    filterCategory="REVESTIMENTOS"
                  />
                </div>

                {/* Passo 7: Serviços - Efeitos Decorativos */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 7 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <ServicesSelector 
                    library={library} 
                    selectedServices={budget.services} 
                    onChange={handleServicesChange} 
                    filterCategory="EFEITOS DECORATIVOS"
                  />
                </div>

                {/* Passo 8: Serviços - Equipamentos e Diferenciais */}
                <div className={`w-[12.5%] shrink-0 px-1 space-y-4 ${currentStep === 8 ? '' : 'h-0 min-h-0 overflow-hidden'}`}>
                  <ServicesSelector 
                    library={library} 
                    selectedServices={budget.services} 
                    onChange={handleServicesChange} 
                    filterCategory="EQUIPAMENTOS E DIFERENCIAIS"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLES DE NAVEGAÇÃO DO STEPPER */}
          <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-800/85 shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-350 hover:bg-slate-850 hover:text-white transition cursor-pointer"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => {
                if (currentStep < 8) {
                  setCurrentStep(currentStep + 1);
                } else {
                  handleSaveBudget();
                  setActiveMobileTab('preview');
                }
              }}
              className="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-slate-950 text-xs font-extrabold shadow-md shadow-brand/10 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{currentStep === 8 ? "Finalizar (Ver PDF)" : "Próximo"}</span>
            </button>
          </div>
        </div>

        {/* COLUNA 2: CANVAS / PRÉVIA DO PDF */}
        <div 
          className={`w-full lg:w-[52%] xl:w-[55%] h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] overflow-y-auto p-4 md:p-8 bg-slate-900/60 lg:border-l border-slate-800 flex justify-center items-start ${
            activeMobileTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="w-full flex justify-center">
            <div className="preview-scale-wrapper">
              <PdfPreview budget={budget} printOnlyPage1={printOnlyPage1} />
            </div>
          </div>
        </div>

      </main>

      {/* MODAL: HISTÓRICO DE ORÇAMENTOS (no-print) */}
      <HistoryList
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        budgets={budgets}
        onLoadBudget={handleLoadBudget}
        onDuplicateBudget={handleDuplicateBudget}
        onDeleteBudget={handleDeleteBudget}
        onPrintBudget={handlePrintDirect}
      />

      {/* MODAL: GERENCIADOR DE ITENS (no-print) */}
      <LibraryManager
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        library={library}
        onSaveLibrary={handleSaveLibrary}
        budgets={budgets}
      />

      {/* MODAL: IMPORTAÇÃO DE PDF COM DIRETRIZES DA IA (no-print) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Importar Projeto com IA</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedImportFiles([]);
                  setImportInstructions('');
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Instruções Adicionais para a IA (Opcional)
                </label>
                <textarea
                  placeholder="Ex: Ignorar o deck externo da arquiteta, focar apenas na pintura interna de paredes e tetos, usar massa corrida apenas nas suítes..."
                  value={importInstructions}
                  onChange={(e) => setImportInstructions(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-brand/40 rounded-lg p-3 text-xs text-slate-200 outline-none transition resize-none placeholder-slate-600"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Digite regras que você deseja que a inteligência artificial respeite na hora de analisar e catalogar os cômodos.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Arquivos de Projeto (PDF)
                </label>
                
                {selectedImportFiles.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-brand/30 bg-slate-950/40 hover:bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-slate-400"
                  >
                    <Upload className="w-6 h-6 text-brand/70" />
                    <span className="text-xs font-medium">Selecionar Arquivos PDF do Projeto</span>
                    <span className="text-[10px] text-slate-600">Suporta múltiplos PDFs</span>
                  </button>
                ) : (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="space-y-2">
                      {selectedImportFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-900 border border-slate-850/60 rounded px-3 py-2 text-slate-300">
                          <span className="truncate max-w-[280px] font-mono text-[11px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedImportFiles(selectedImportFiles.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-brand hover:text-brand-hover font-semibold cursor-pointer"
                      >
                        + Adicionar arquivo
                      </button>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedImportFiles.length} selecionado(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedImportFiles([]);
                  setImportInstructions('');
                }}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedImportFiles.length === 0}
                onClick={async () => {
                  setIsImportModalOpen(false);
                  const filesToImport = [...selectedImportFiles];
                  const instructionsToUse = importInstructions;
                  setSelectedImportFiles([]);
                  setImportInstructions('');
                  await handleImportPDF(filesToImport, instructionsToUse);
                }}
                className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-brand/5"
              >
                Gerar Proposta com IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden A4 preview used exclusively for html2canvas generation to prevent scaling & overlapping text bugs in Safari/WebKit */}
      <div className="no-print absolute top-[-9999px] left-[-9999px] pointer-events-none" style={{ width: '210mm', height: 'auto' }}>
        <div id="pdf-hidden-capture">
          <PdfPreview budget={budget} printOnlyPage1={printOnlyPage1} isCapture={true} />
        </div>
      </div>

      {/* TOAST NOTIFICATION DE FLUTUAÇÃO */}
      {toast && (
        <div 
          className={`no-print fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border text-xs font-semibold z-50 transition-all duration-300 animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-800/50 text-red-200 shadow-red-900/10'
              : 'bg-slate-900/90 border-slate-800 text-brand shadow-slate-950/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        multiple
        className="hidden" 
      />
    </div>
  );
}
