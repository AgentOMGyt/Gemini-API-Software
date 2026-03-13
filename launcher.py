import threading, http.server, socketserver, os, subprocess, time
from pynput import keyboard

PORT = 8000
HOTKEY_CHAR = '²'
BROWSER_CMD = "msedge"

app_process = None
# On crée un contrôleur pour manipuler le clavier
controller = keyboard.Controller()

def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda *args: None
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            httpd.serve_forever()
    except OSError: pass

def toggle_app():
    global app_process
    url = f"http://localhost:{PORT}/index.html"

    if app_process is not None and app_process.poll() is None:
        print("🛑 Fermeture...")
        app_process.terminate()
        app_process = None
    else:
        print("🚀 Ouverture...")
        cmd = [BROWSER_CMD, f"--app={url}"]
        try:
            app_process = subprocess.Popen(cmd)
        except FileNotFoundError:
            app_process = subprocess.Popen(f'start {BROWSER_CMD} --app={url}', shell=True)

def on_press(key):
    try:
        if hasattr(key, 'char') and key.char == HOTKEY_CHAR:
            # 1. On efface le caractère '²' qui vient d'être tapé
            # en simulant un appui sur Retour Arrière (Backspace)
            controller.press(keyboard.Key.backspace)
            controller.release(keyboard.Key.backspace)

            # 2. On switch l'application
            toggle_app()

            # 3. Petit délai pour éviter les doubles déclenchements
            time.sleep(0.3)
    except AttributeError:
        pass

if __name__ == "__main__":
    print("--- GEMINI DESKTOP (Touche ² avec Auto-Clean) ---")
    threading.Thread(target=start_server, daemon=True).start()
    time.sleep(1)
    print(f"Prêt ! Appuie sur [ ² ] (le caractère sera auto-effacé).")

    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()