import ShareManager from './ShareManager.js';
import TranslationManager from './TranslationManager.js';
export class ShareExportManager {
    static buildPayload(state, inputs, trainingTargetDate, trainingPlanDistance) {
        return {
            state,
            inputs,
            trainingTargetDate,
            trainingPlanDistance
        };
    }
    static async copyShareLink(payload) {
        try {
            const finalURL = ShareManager.buildShareURL(payload);
            await navigator.clipboard.writeText(finalURL);
            alert(TranslationManager.get('share_link_copied'));
        }
        catch {
            alert(TranslationManager.get('share_link_failed'));
        }
    }
    static openTrainingReportPage(payload) {
        const reportURL = ShareManager.buildShareURL(payload, 'training-report.html');
        window.open(reportURL, '_blank');
    }
    static exportPDF() {
        window.print();
    }
    static exportImage() {
        const target = document.querySelector('.main-wrapper');
        const html2canvasFn = window.html2canvas;
        if (!target || !html2canvasFn) {
            alert('Image export unavailable');
            return;
        }
        html2canvasFn(target, { backgroundColor: null, scale: 2 }).then((canvas) => {
            const link = document.createElement('a');
            link.download = 'running-pace-note.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
}
export default ShareExportManager;
