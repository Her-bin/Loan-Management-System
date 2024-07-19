function calculateLoanAmount() {
    const amountElement = document.getElementById("amount");
    const yearsElement = document.getElementById("years");
    const monthlyPaymentElement = document.getElementById("monthly-payment");
    const totalPaymentElement = document.getElementById("total-payment");
    const totalInterestElement = document.getElementById("total-interest");

    const principal = parseFloat(amountElement.value);
    const calculatedInterest = 5 / 100 / 12;  // Assuming a fixed interest rate of 5%
    const calculatedPayment = parseFloat(yearsElement.value) * 12;

    const x = Math.pow(1 + calculatedInterest, calculatedPayment);
    const monthly = (principal * x * calculatedInterest) / (x - 1);

    if (isFinite(monthly)) {
        monthlyPaymentElement.value = monthly.toFixed(2);
        totalPaymentElement.value = (monthly * calculatedPayment).toFixed(2);
        totalInterestElement.value = ((monthly * calculatedPayment) - principal).toFixed(2);
    } else {
        monthlyPaymentElement.value = '';
        totalPaymentElement.value = '';
        totalInterestElement.value = '';
    }
}

document.getElementById("amount").addEventListener("input", calculateLoanAmount);
document.getElementById("years").addEventListener("input", calculateLoanAmount);
