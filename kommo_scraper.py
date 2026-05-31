from playwright.sync_api import sync_playwright
import time
import os

def main():
    os.makedirs('kommo_screenshots', exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        print("Acessando Kommo...")
        page.goto('https://marcelogeusti.kommo.com/')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='kommo_screenshots/01_login_page.png')
        
        print("Preenchendo login...")
        # A página de login pode ter seletores específicos. Vamos tentar os genéricos de e-mail/senha.
        try:
            page.fill('input[type="text"], input[type="email"], input[name="USER_LOGIN"]', 'marcelogeus@gmail.com')
            page.fill('input[type="password"], input[name="USER_PASSWORD"]', 'G@usti8826')
            page.screenshot(path='kommo_screenshots/02_filled_login.png')
            
            # Clicar em login
            page.click('button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Entrar")')
            print("Aguardando carregamento do dashboard...")
            page.wait_for_load_state('networkidle')
            time.sleep(5) # Extra wait for dynamic content
            page.screenshot(path='kommo_screenshots/03_dashboard.png', full_page=True)
            
            # Print URL to see where we landed
            print("URL atual:", page.url)
            
            # Navegar para as páginas
            # Pipeline/Leads
            page.goto('https://marcelogeusti.kommo.com/leads/pipeline/')
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            page.screenshot(path='kommo_screenshots/04_pipeline.png', full_page=True)
            
            # Lista de Contatos
            page.goto('https://marcelogeusti.kommo.com/contacts/list/')
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            page.screenshot(path='kommo_screenshots/05_contacts.png', full_page=True)

            # Analytics / Dashboard
            page.goto('https://marcelogeusti.kommo.com/dashboard/')
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            page.screenshot(path='kommo_screenshots/06_analytics.png', full_page=True)

        except Exception as e:
            print(f"Erro: {e}")
            page.screenshot(path='kommo_screenshots/error.png')
            
        browser.close()

if __name__ == '__main__':
    main()
