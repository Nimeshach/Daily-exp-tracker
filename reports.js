document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("report-body");
    const chartCanvas = document.createElement('canvas');
    chartCanvas.id = 'expenseChart';
    chartCanvas.style.maxWidth = '600px';
    chartCanvas.style.margin = '20px auto';
    document.querySelector('.content').insertBefore(chartCanvas, document.getElementById('report-table'));

    // Center align the table
    const reportTable = document.getElementById('report-table');
    reportTable.style.margin = '20px auto';
    reportTable.style.width = '80%';
    reportTable.style.maxWidth = '800px';

    // Style for download button
    const downloadButton = document.getElementById('download-pdf');
    if (downloadButton) {
        downloadButton.style.display = 'block';
        downloadButton.style.margin = '20px auto';
    }
    
    // Function to fetch expenses from the server
    async function fetchExpenses() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                window.location.href = 'homepage.html';
                return [];
            }
            const response = await fetch('http://localhost:3000/api/expenses', {
                headers: {
                    'Authorization': token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch expenses');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return [];
        }
    }
    
    async function updateTable() {
        tableBody.innerHTML = "";
        const expenses = await fetchExpenses();
    
        if (expenses.length === 0) {
            tableBody.innerHTML = `<tr><td colspan=\"3\" style=\"text-align:center;\">No expenses recorded</td></tr>`;
            return;
        }

        // Calculate category summaries
        const categorySummary = {};
        expenses.forEach(expense => {
            if (!categorySummary[expense.category]) {
                categorySummary[expense.category] = 0;
            }
            categorySummary[expense.category] += expense.amount;
        });

        // Update table with expenses
        expenses.forEach(expense => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${expense.category}</td>
                           <td>NRs ${expense.amount.toFixed(2)}</td>
                           <td>${expense.date}</td>`;
            tableBody.appendChild(row);
        });

        // Add category summary section
        const summarySection = document.createElement('div');
        summarySection.innerHTML = '<h2>Category Summary</h2>';
        document.querySelector('.content').insertBefore(summarySection, document.getElementById('download-pdf'));

        // Create and update pie chart
        const ctx = document.getElementById('expenseChart').getContext('2d');
        const chartData = {
            labels: Object.keys(categorySummary),
            datasets: [{
                data: Object.values(categorySummary),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#66FF99',
                    '#FF99CC'
                ]
            }]
        };

        new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category (in NRs)'
                    }
                }
            }
        });
    }
    
    // Initialize PDF download button
    if (downloadButton) {
        downloadButton.addEventListener("click", async () => {
            try {
                const expenses = await fetchExpenses();
                
                if (expenses.length === 0) {
                    alert('No expenses to download');
                    return;
                }
                
                const pdf = new jsPDF();
                pdf.setFont("helvetica");
                pdf.setFontSize(16);
                pdf.text('Expense Report', 20, 20);
                
                // Add date
                pdf.setFontSize(12);
                pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
                
                // Add total amount
                const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
                pdf.text(`Total Expenses: NRs ${total.toFixed(2)}`, 20, 40);
                
                // Add category summary
                pdf.text('Category Summary:', 20, 55);
                let yPos = 65;
                const categorySummary = {};
                expenses.forEach(expense => {
                    if (!categorySummary[expense.category]) {
                        categorySummary[expense.category] = 0;
                    }
                    categorySummary[expense.category] += expense.amount;
                });
                
                Object.entries(categorySummary).forEach(([category, amount]) => {
                    pdf.text(`${category}: NRs ${amount.toFixed(2)}`, 30, yPos);
                    yPos += 10;
                });
                
                // Add detailed expenses
                yPos += 10;
                pdf.text('Detailed Expenses:', 20, yPos);
                yPos += 10;
                
                expenses.forEach((expense, index) => {
                    if (yPos > 270) { // Check if we need a new page
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(`${index + 1}. ${expense.category}: NRs ${expense.amount.toFixed(2)} (${expense.date})`, 30, yPos);
                    yPos += 10;
                });
                
                pdf.save('expense-report.pdf');
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
            }
        });
    }
    
    updateTable();
});
