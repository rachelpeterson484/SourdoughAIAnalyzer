import { Recipe, Loaf } from '../types';

export class FileStorage {
  private static readonly FILENAME = 'sourdough-data.json';

  static async exportData(): Promise<{ recipes: Recipe[], loaves: Loaf[] }> {
    const recipes = JSON.parse(localStorage.getItem('sourdough_recipes') || '[]');
    const loaves = JSON.parse(localStorage.getItem('sourdough_loaves') || '[]');
    
    return { recipes, loaves };
  }

  static async importData(data: { recipes: Recipe[], loaves: Loaf[] }): Promise<void> {
    localStorage.setItem('sourdough_recipes', JSON.stringify(data.recipes));
    localStorage.setItem('sourdough_loaves', JSON.stringify(data.loaves));
    
    // Trigger events to refresh UI
    window.dispatchEvent(new CustomEvent('dataImported'));
  }

  static downloadBackup(): void {
    this.exportData().then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sourdough-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  static async restoreFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.importData(data);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
