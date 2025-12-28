import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface HistoryItem {
    id: string;
    expression: string;
    result: string;
}

export const exportEngineeringReport = async (
    history: HistoryItem[],
    activeTab: string,
    chartType: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header Logic
    const addHeader = (title: string) => {
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('T-SuperMachine', 14, 20);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(title, 14, 30);

        doc.setFontSize(10);
        doc.text(new Date().toLocaleString(), pageWidth - 14, 30, { align: 'right' });

        doc.setTextColor(0, 0, 0);
    };

    addHeader('Mühendislik Hesap Raporu');
    let currentY = 50;

    // 2. Calculation History Table
    if (history.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Hesaplama Geçmişi', 14, currentY);
        currentY += 10;

        autoTable(doc, {
            startY: currentY,
            head: [['İşlem', 'Sonuç']],
            body: history.map(item => [item.expression, item.result]),
            theme: 'striped',
            headStyles: { fillColor: [52, 73, 94] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            styles: { fontSize: 10, cellPadding: 5 },
        });

        // @ts-expect-error - autotable types
        currentY = doc.lastAutoTable.finalY + 20;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('(Hesaplama geçmişi boş)', 14, currentY + 5);
        currentY += 20;
        doc.setTextColor(0);
    }

    // 3. Chart Export (if visible)
    if (activeTab === 'charts') {
        const chartElement = document.querySelector('.js-plotly-plot');

        if (currentY > 200) {
            doc.addPage();
            addHeader('Mühendislik Hesap Raporu (Devam)');
            currentY = 50;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Grafik Analizi', 14, currentY);
        currentY += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Grafik Tipi: ${chartType.toUpperCase()}`, 14, currentY);
        currentY += 10;

        if (chartElement) {
            try {
                // Use html2canvas to capture the chart
                const canvas = await html2canvas(chartElement as HTMLElement, {
                    backgroundColor: '#ffffff', // Ensure white background for PDF
                    scale: 2, // Higher quality
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (currentY + imgHeight > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 10;
            } catch (error) {
                console.error('PDF Grafik hatası:', error);
                doc.setTextColor(231, 76, 60);
                doc.text('Grafik oluşturulurken hata oluştu.', 14, currentY);
                doc.setTextColor(0);
            }
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('(Grafik bulunamadı veya render edilmedi)', 14, currentY);
        }
    }

    // 4. Footer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageCount = (doc.internal as any).getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Sayfa ${i} / ${pageCount} - T-SuperMachine Engineering Suite`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`TSM_Rapor_${new Date().toISOString().slice(0, 10)}.pdf`);
};
