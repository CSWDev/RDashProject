describe('Navigation', () => {
    it('should navigate through all pages', () => {
        // Start from the index page
        cy.visit('http://localhost:3000/')
    
        // Find a link with an href attribute containing "about" and click it
        cy.get('a[href*="login"]').click()
    
        // The new url should include "/about"
        cy.url().should('include', '/login')
    
        // The new page should contain an h1 with "About"
        cy.get('h1').contains('Please log in to continue.')

        // Start from the index page
        cy.visit('http://localhost:3000/login')
        
        // Enter email
        cy.get('input[name="email"]').type('user@nextmail.com');  

        // Enter password
        cy.get('input[name="password"]').type('123456');

        // Find a link with an href attribute containing "about" and click it
        cy.get('button').contains('Log in').click()

        // The new page should contain an h1 with "Dashboard"
        cy.get('h1').contains('Dashboard')

        // The new page should contain an h1 with "Dashboard"
        cy.get('h1').contains('Dashboard')
            
        // Find a link with an href attribute containing "Invoices" and click it
        cy.get('a').contains('Invoices').click()
            
        // The new page should contain an h1 with "Invoices"
        cy.get('h1').contains('Invoices')

        // Find a link with an href attribute containing "Customers" and click it
        cy.get('a').contains('Customers').click()
            
        // The new page should contain an h1 with "Customers"
        cy.get('h1').contains('Customers')
    })
})