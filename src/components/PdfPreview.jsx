import React from 'react';
import { Phone, MapPin, Calendar, CreditCard, Clock, FileText } from 'lucide-react';

export default function PdfPreview({ budget, printOnlyPage1, isCapture = false }) {
  const categories = ["PREPARAÇÃO", "PINTURA", "REVESTIMENTOS", "EFEITOS DECORATIVOS", "EQUIPAMENTOS E DIFERENCIAIS"];

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const cleanDate = dateString.split('T')[0].split(' ')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        if (year.length === 4) {
          return `${day}/${month}/${year.slice(-2)}`;
        }
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  // Agrupar os serviços selecionados por categoria
  const groupedServices = categories.reduce((acc, cat) => {
    const services = budget.services?.filter(s => s.category === cat) || [];
    if (services.length > 0) {
      acc[cat] = services;
    }
    return acc;
  }, {});

  const hasServices = budget.services && budget.services.length > 0;
  const numServices = budget.services?.length || 0;
  const hasQuantities = budget.services?.some(s => (parseFloat(s.quantity) || 0) > 0);
  const totalPages = budget.environments && budget.environments.length > 0 ? 3 : (hasServices ? 2 : 1);

  // Algoritmo de escala dinâmica para caber em uma página
  const getCompactStyles = (count) => {
    if (count > 24) {
      // Super compacto (para 25 a 35+ itens) - Fontes e paddings balanceados
      return {
        pagePadding: "p-4 md:p-6 print:p-4",
        headerMargin: "mb-2 pb-2",
        logoSize: "w-10 h-10",
        headerTitle: "text-base",
        clientMargin: "mb-2 p-2.5",
        clientGrid: "gap-y-0.5 gap-x-3",
        servicesGap: "gap-2",
        servicePadding: "p-1.5",
        serviceTitle: "text-[9px] mb-0.5 pb-0.5",
        serviceText: "text-[9.5px] leading-tight font-semibold",
        termsMargin: "mt-3 pt-2.5 space-y-2",
        termsPadding: "p-2",
        termsText: "text-[9px]",
        termsValue: "text-base font-bold",
        notesPadding: "p-2 text-[8.5px] leading-snug",
        footerMargin: "mt-2 pt-1.5"
      };
    } else if (count > 12) {
      // Compacto (para 13 a 24 itens)
      return {
        pagePadding: "p-5 md:p-7 print:p-5",
        headerMargin: "mb-3 pb-3",
        logoSize: "w-12 h-12",
        headerTitle: "text-lg",
        clientMargin: "mb-3 p-3.5",
        clientGrid: "gap-y-1 gap-x-4",
        servicesGap: "gap-2.5",
        servicePadding: "p-2",
        serviceTitle: "text-[9.5px] mb-1 pb-0.5",
        serviceText: "text-[10px] leading-tight font-semibold",
        termsMargin: "mt-4 pt-3.5 space-y-3",
        termsPadding: "p-3",
        termsText: "text-[9.5px]",
        termsValue: "text-lg font-extrabold",
        notesPadding: "p-2.5 text-[9px] leading-snug",
        footerMargin: "mt-3 pt-2"
      };
    } else {
      // Confortável padrão (para até 12 itens)
      return {
        pagePadding: "p-6 md:p-8 print:p-6",
        headerMargin: "mb-4 pb-4",
        logoSize: "w-14 h-14",
        headerTitle: "text-lg",
        clientMargin: "mb-4 p-4",
        clientGrid: "gap-y-1.5 gap-x-5",
        servicesGap: "gap-3",
        servicePadding: "p-2.5",
        serviceTitle: "text-[9.5px] mb-1.5 pb-0.5",
        serviceText: "text-[11px] leading-normal font-semibold",
        termsMargin: "mt-6 pt-4 space-y-4",
        termsPadding: "p-3",
        termsText: "text-[10px]",
        termsValue: "text-lg font-extrabold",
        notesPadding: "p-2.5 text-[9.5px] leading-snug",
        footerMargin: "mt-4 pt-3"
      };
    }
  };

  const s = getCompactStyles(numServices);

  return (
    <div id="pdf-full-document" className={`space-y-8 no-print-gap print:space-y-0 print:gap-0 w-full max-w-[210mm] ${isCapture ? '' : 'screen-preview-zoom'}`}>
      
      {/* ================= PÁGINA 1: DETALHES DO ORÇAMENTO ================= */}
      <div id="pdf-page-1" className={`print-container bg-white text-slate-800 shadow-xl border border-slate-200 mx-auto w-full min-h-[297mm] font-sans flex flex-col justify-between rounded-lg print:shadow-none print:border-none print:rounded-none ${s.pagePadding}`}>
        <div>
          {/* CABEÇALHO PROPOSTA */}
          <div className={`flex justify-between items-start border-b-2 border-emerald-500/20 ${s.headerMargin}`}>
            <div className="flex items-center gap-4">
              <div className={`${s.logoSize} bg-slate-900 rounded-lg flex items-center justify-center p-1 border border-slate-800 shrink-0`}>
                <img src="/logo.png" alt="Logo Júlio Peixer" className="w-full h-full object-cover rounded" />
              </div>
              <div>
                <h1 className={`${s.headerTitle} font-bold text-slate-900`}>JÚLIO PEIXER</h1>
                <p className="text-[10px] md:text-xs font-semibold text-teal-600 tracking-widest uppercase">Pinturas Residenciais e Comerciais</p>
                <div className="flex items-center gap-3 text-[9px] md:text-[10px] text-slate-500 mt-1 font-medium">
                  <span className="flex items-center gap-0.5">
                    <Phone className="w-3 h-3 text-teal-600" />
                    +55 47 99783-4321
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-teal-600" />
                    Bal. Barra do Sul - SC
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] md:text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 uppercase tracking-wider">
                PROPOSTA COMERCIAL
              </span>
              <div className="mt-2.5 text-xs space-y-0.5 text-slate-700">
                <p><span className="font-semibold text-slate-800">Orçamento:</span> <span className="font-mono font-bold text-slate-900">{budget.id}</span></p>
                <p className="flex items-center justify-end gap-1"><Calendar className="w-3 h-3 text-slate-400" /> <span>{formatDate(budget.date)}</span></p>
              </div>
            </div>
          </div>

          {/* DADOS DO CLIENTE */}
          <div className={`bg-slate-50 border border-slate-100 rounded-lg ${s.clientMargin}`}>
            <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1.5 border-b border-slate-200 pb-0.5">
              CLIENTE / LOCAL DA OBRA
            </h3>
            <div className={`grid grid-cols-1 md:grid-cols-2 text-xs text-slate-700 ${s.clientGrid}`}>
              <p><span className="font-semibold text-slate-800">Nome:</span> {budget.client?.name || '-'}</p>
              <p><span className="font-semibold text-slate-800">Telefone:</span> {budget.client?.phone || '-'}</p>
              <p className="md:col-span-2"><span className="font-semibold text-slate-800">Endereço:</span> {budget.client?.address || '-'} {budget.client?.city ? `, ${budget.client.city}` : ''}</p>
            </div>
            {budget.client?.notes && (
              <div className="mt-2 pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-500 italic">
                <span className="font-semibold not-italic text-slate-600 text-[9px] uppercase tracking-wider block mb-0.5">Observações da Obra:</span>
                "{budget.client.notes}"
              </div>
            )}
          </div>

          {/* LISTAGEM DE SERVIÇOS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>{hasQuantities ? 'Resumo Geral dos Serviços' : 'Serviços Propostos'}</span>
            </h3>

            {!hasServices ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                Nenhum serviço selecionado. Marque os serviços desejados no painel de edição.
              </div>
            ) : hasQuantities ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/20">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-200 uppercase tracking-wider text-[8px] font-bold">
                      <th className="py-1.5 px-3">Serviço</th>
                      <th className="py-1.5 px-3 text-right">Qtd. / Unid.</th>
                      <th className="py-1.5 px-3 text-right">Valor Unit.</th>
                      <th className="py-1.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {budget.services
                      .filter(s => (parseFloat(s.quantity) > 0))
                      .map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/30">
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{s.name}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600">{(parseFloat(s.quantity) || 0).toLocaleString('pt-BR')} {s.unit || 'm²'}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600">{formatCurrency(s.unitPrice)}</td>
                          <td className="py-1.5 px-3 text-right font-bold font-mono text-slate-800">{formatCurrency(s.subtotal || ((parseFloat(s.quantity) || 0) * (parseFloat(s.unitPrice) || 0)))}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map(cat => {
                  const services = groupedServices[cat];
                  if (!services) return null;

                  const isBlue = cat === "EQUIPAMENTOS E DIFERENCIAIS";
                  const titleColor = isBlue ? "text-blue-700 border-blue-200" : "text-teal-700 border-teal-100";
                  const bgColor = isBlue ? "bg-blue-50/40 border-blue-100/30" : "bg-slate-50/50 border-slate-100/50";
                  
                  const servicesText = services.map(sItem => sItem.name).join(', ');

                  return (
                    <div key={cat} className={`space-y-1 rounded-lg border ${bgColor} ${s.servicePadding}`}>
                      <h4 className={`font-bold tracking-widest uppercase border-b ${titleColor} ${s.serviceTitle}`}>
                        {cat}
                      </h4>
                      <p className={`text-slate-800 font-semibold ${s.serviceText} leading-relaxed`}>
                        {servicesText}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CONDIÇÕES COMERCIAIS E RODAPÉ (PÁGINA 1) */}
        <div className={`border-t border-slate-100 ${s.termsMargin}`}>
          
          {/* VALOR, PRAZO E PAGAMENTO */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`bg-teal-50/40 border border-teal-100 rounded-lg flex flex-col justify-between ${s.termsPadding}`}>
              <span className={`font-bold text-teal-700 uppercase tracking-wider block mb-0.5 ${s.termsText}`}>
                Investimento Total
              </span>
              <span className={`font-mono font-extrabold text-teal-600 ${s.termsValue}`}>
                {formatCurrency(budget.value)}
              </span>
            </div>

            <div className={`bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between ${s.termsPadding}`}>
              <span className={`font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1 ${s.termsText}`}>
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Prazo Estimado</span>
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {budget.duration || 'Não informado'}
              </span>
            </div>

            <div className={`bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between ${s.termsPadding}`}>
              <span className={`font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1 ${s.termsText}`}>
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                <span>Forma de Pagamento</span>
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {budget.payment || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Termos e Observações do Profissional */}
          {budget.notes && (
            <div className={`bg-slate-50 border border-slate-100 rounded-lg text-slate-500 ${s.notesPadding}`}>
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-0.5">Observações e Termos:</span>
              <p className="whitespace-pre-line">{budget.notes}</p>
            </div>
          )}

          {/* Rodapé institucional */}
          <div className={`flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-150 ${s.footerMargin}`}>
            <p>© {new Date().getFullYear()} Júlio Peixer Pinturas.</p>
            <p className="font-medium tracking-wide">Qualidade, Segurança, Tecnologia e Compromisso</p>
            <p className="text-slate-500 font-mono">Pág. 1 / {totalPages}</p>
          </div>
        </div>
      </div>

      {/* ================= PÁGINA 2: GLOSSÁRIO E ESPECIFICAÇÕES ================= */}
      {hasServices && !printOnlyPage1 && (
        <div id="pdf-page-2" className={`print-container page-break bg-white text-slate-800 shadow-xl border border-slate-200 mx-auto w-full font-sans flex flex-col justify-between rounded-lg print:shadow-none print:border-none print:rounded-none ${s.pagePadding}`}>
          <div>
            {/* CABEÇALHO ANEXO */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center p-0.5 border border-slate-800 shrink-0">
                  <img src="/logo.png" alt="Logo Júlio Peixer" className="w-full h-full object-cover rounded" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">JÚLIO PEIXER PINTURAS</h2>
                  <p className="text-[9px] font-semibold text-teal-600 tracking-wider uppercase">Memorial Descritivo e Glossário de Serviços</p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 font-mono">
                <span>Orçamento: {budget.id}</span>
              </div>
            </div>

            {/* CONTEÚDO DO GLOSSÁRIO */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-1 mb-1">
                  Especificações Técnicas dos Serviços Selecionados
                </h3>
                <p className="text-[10px] text-slate-600">
                  Este anexo detalha o escopo de trabalho e a metodologia aplicada para cada item contratado na proposta comercial.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {categories.map(cat => {
                  const services = groupedServices[cat];
                  if (!services) return null;

                  return (
                    <div key={cat} className="space-y-2 col-span-1">
                      <h4 className="text-[9px] font-bold tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded border-l-2 border-teal-500 uppercase">
                        {cat}
                      </h4>
                      
                      <div className="space-y-3">
                        {services.map(sItem => (
                          <div key={sItem.id} className="text-[10px] space-y-0.5 leading-relaxed">
                            <h5 className="font-bold text-slate-800 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-teal-500"></span>
                              {sItem.name}
                            </h5>
                            <p className="text-slate-600 italic pl-2 whitespace-pre-line text-[9px] md:text-[9.5px]">
                              {sItem.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RODAPÉ (PÁGINA 2) */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-[9px] text-slate-400">
              <p>© {new Date().getFullYear()} Júlio Peixer Pinturas. Memorial de Serviços.</p>
              <p className="font-medium tracking-wide">Qualidade, Segurança, Tecnologia e Compromisso</p>
              <p className="text-slate-500 font-mono">Pág. 2 / {totalPages}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= PÁGINA 3: DETALHAMENTO DE AMBIENTES (Se houver importação de projeto) ================= */}
      {budget.environments && budget.environments.length > 0 && !printOnlyPage1 && (
        <div id="pdf-page-3" className={`print-container page-break bg-white text-slate-800 shadow-xl border border-slate-200 mx-auto w-full min-h-[297mm] font-sans flex flex-col justify-between rounded-lg print:shadow-none print:border-none print:rounded-none ${s.pagePadding}`}>
          <div>
            {/* CABEÇALHO PAGINA 3 */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center p-0.5 border border-slate-800 shrink-0">
                  <img src="/logo.png" alt="Logo Júlio Peixer" className="w-full h-full object-cover rounded" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">JÚLIO PEIXER PINTURAS</h2>
                  <p className="text-[9px] font-semibold text-teal-600 tracking-wider uppercase font-sans">Detalhamento Técnico por Ambiente</p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500 font-mono">
                <span>Orçamento: {budget.id}</span>
              </div>
            </div>

            {/* LISTA DE AMBIENTES */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-1 mb-1 font-sans">
                  Memorial Técnico de Ambientes
                </h3>
                <p className="text-[10px] text-slate-600">
                  Abaixo estão especificadas as áreas, acabamentos e tintas para cada ambiente identificado no projeto da arquiteta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budget.environments.map((env, idx) => (
                  <div key={idx} className="bg-slate-50/60 border border-slate-100/80 rounded-xl p-3.5 space-y-2 text-[10px] leading-relaxed">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <span className="font-extrabold text-slate-800 text-xs">{env.name}</span>
                      <span className="text-[9px] font-semibold text-teal-700 bg-teal-50/50 px-1.5 py-0.5 rounded border border-teal-100">
                        {env.area ? `${env.area.toFixed(2)} m²` : ''} 
                        {env.area && env.height ? ' | ' : ''} 
                        {env.height ? `PD: ${env.height.toFixed(2)}m` : ''}
                      </span>
                    </div>

                    {env.finishes && (
                      <p className="text-slate-650 text-[9.5px]">
                        <span className="font-bold text-slate-800">Acabamento:</span> {env.finishes}
                      </p>
                    )}

                    {env.services && env.services.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-500 text-[9px] uppercase tracking-wider block">Serviços:</span>
                        <div className="bg-white border border-slate-100 rounded-lg p-2">
                          <table className="w-full text-left text-slate-700">
                            <tbody>
                              {env.services.map((srv, sIdx) => {
                                const match = budget.services?.find(item => item.id === srv.serviceId);
                                return (
                                  <tr key={sIdx} className="border-b border-slate-50 last:border-0 text-[9.5px]">
                                    <td className="py-0.5 pr-2 font-medium">{match ? match.name : srv.serviceId}</td>
                                    <td className="py-0.5 text-right font-mono font-bold text-slate-800">{srv.quantity ? `${(parseFloat(srv.quantity) || 0).toLocaleString('pt-BR')} ${match?.unit || 'm²'}` : '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {env.paints && env.paints.length > 0 && (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-500 text-[9px] uppercase tracking-wider block">Especificação de Tintas:</span>
                        <ul className="list-disc pl-4 text-slate-650 text-[9px] space-y-0.5">
                          {env.paints.map((p, pIdx) => (
                            <li key={pIdx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {env.observations && env.observations.length > 0 && (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-500 text-[9px] uppercase tracking-wider block">Observações Técnicas:</span>
                        <ul className="list-disc pl-4 text-slate-500 italic text-[9px] space-y-0.5">
                          {env.observations.map((obs, obsIdx) => (
                            <li key={obsIdx}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RODAPÉ (PÁGINA 3) */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-[9px] text-slate-400">
              <p>© {new Date().getFullYear()} Júlio Peixer Pinturas. Detalhamento Técnico.</p>
              <p className="font-medium tracking-wide">Qualidade, Segurança, Tecnologia e Compromisso</p>
              <p className="text-slate-500 font-mono">Pág. 3 / {totalPages}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
