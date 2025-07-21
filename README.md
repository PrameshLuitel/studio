# Portfolio Pulse 📈

**Portfolio Pulse** is a sophisticated, web-based financial analysis tool designed to provide deep insights into investment portfolios. By simply uploading an `.xlsx` file, users can unlock a dynamic dashboard, detailed client data views, and an interactive chatbot to analyze their financial data seamlessly.

The application is built with a modern, responsive interface using a glassmorphism design, ensuring an intuitive and aesthetically pleasing user experience across all devices.

## ✨ Key Features

- **XLSX File Upload & Parsing**: Effortlessly upload `.xlsx` files. The application uses SheetJS to parse the data from required worksheets (`Portfolio`, `Sector Holding Summary`, `EPS`).
- **Interactive Dashboard**: Visualize key metrics at a glance:
    - Total Assets Under Management (AUM)
    - Client Gain/Loss statistics
    - Asset and Sector-wise allocation charts (for all clients, and segmented by gain or loss)
    - AUM distribution based on years to expiry
    - Top Gainers, Top Losers, and Largest Portfolios
- **Detailed Client Data View**: A searchable and sortable table of all clients. Click on any client to drill down into a detailed view, including their individual sector allocations and a comprehensive breakdown of their portfolio metrics.
- **EPS Data Viewer**: A dedicated view to display and analyze Earnings Per Share (EPS) data from the `EPS` worksheet.
- **Rule-Based Chatbot ("Ask Gicl")**: An interactive chatbot that answers specific, pre-defined questions about the portfolio data, such as total AUM, client counts, and details for specific clients.
- **Modern UI/UX**:
    - Built with Shadcn/UI and Tailwind CSS for a clean, professional look.
    - Features a sleek glassmorphism design with frosted cards and translucent layers.
    - Utilizes custom fonts ('Inter' and 'Space Grotesk') and `lucide-react` for icons.
    - Includes subtle animations and interactive elements for enhanced user engagement.
- **PWA Ready**: The application is configured as a Progressive Web App for an installable, app-like experience.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **File Parsing**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### How to Use the Application

1.  **Launch the App**: Open the application in your browser.
2.  **Upload Your File**: Drag and drop your `.xlsx` portfolio file onto the upload area, or click to select it from your computer.
3.  **Analyze**: Once the file is processed, the main dashboard will appear.
4.  **Explore**: Use the navigation sidebar to switch between the **Dashboard**, **Client Data**, **EPS Viewer**, and **Ask Gicl** views.

### Excel File Requirements

For the application to function correctly, your `.xlsx` file **must** contain the following worksheets with the exact names:

- `Portfolio`
- `Sector Holding Summary`
- `EPS`

The application is designed to read specific columns from these sheets. Please refer to the data processing logic in `src/lib/data-processor.ts` for detailed column mappings.

---

*This application was created to demonstrate modern web development techniques for financial data visualization and analysis.*
