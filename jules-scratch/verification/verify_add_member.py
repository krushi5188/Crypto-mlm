from playwright.sync_api import sync_playwright

def run():
    """
    Run an end-to-end Playwright test that logs in as the admin on the local app and adds a new member.
    
    Performs UI interactions against http://localhost:3001: reveals the admin form, signs in with admin@example.com, navigates to the participants page, opens the Add Member form, submits a new member (newmember@example.com / newmember / password), and captures a success screenshot at jules-scratch/verification/add_member_success.png. On any exception it prints the error, saves an error screenshot to jules-scratch/verification/error.png, and always closes the browser.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Go to the login page
            page.goto("http://localhost:3001/login")

            # Click the logo 5 times to reveal the admin form
            logo = page.locator(".cursor-pointer").first
            for _ in range(5):
                logo.click()

            # Login as admin
            page.fill('input[name="email"]', "admin@example.com")
            page.fill('input[name="password"]', "password")
            page.click('button:has-text("Admin Sign In")')
            page.wait_for_url("http://localhost:3001/instructor/dashboard", timeout=60000)

            # Go to members page
            page.click('a[href="/instructor/participants"]')
            page.wait_for_url("http://localhost:3001/instructor/participants", timeout=60000)

            # Click "Add Member" button
            page.click('button:has-text("Add Member")')

            # Fill out the form
            page.fill('input[name="email"]', "newmember@example.com")
            page.fill('input[name="username"]', "newmember")
            page.fill('input[name="password"]', "password")
            page.click('div.bg-opacity-10.bg-white button[type="submit"]')
            # Wait for the success message
            page.wait_for_selector("text=Member account created successfully", timeout=60000)

            # Take a screenshot
            page.screenshot(path="jules-scratch/verification/add_member_success.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()