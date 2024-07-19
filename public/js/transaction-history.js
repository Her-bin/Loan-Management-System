document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const table = document.getElementById('transactionTable');
    const rows = table.getElementsByTagName('tr');

    function filterTable() {
        const searchText = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowData = row.textContent.toLowerCase();
            const status = row.querySelector('.status').textContent.toLowerCase();

            if ((rowData.includes(searchText) || searchText === '') &&
                (status === statusValue || statusValue === 'all')) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }

    searchInput.addEventListener('input', filterTable);
    statusFilter.addEventListener('change', filterTable);
});