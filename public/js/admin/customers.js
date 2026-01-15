// ajax for modal

let selectedButton = null;

document.querySelectorAll('.btn-block, .btn-unblock').forEach(button => {
    button.addEventListener('click', (e) => {
        selectedButton = e.target;
        const userName = selectedButton.dataset.name;
        const action = selectedButton.dataset.status;

        // Show modal
        document.getElementById('modal-message').textContent = `Are you sure you want to ${action} ${userName}?`;
        document.getElementById('confirmationModal').style.display = 'block';
    });
});

// Cancel button
document.getElementById('modalCancel').addEventListener('click', () => {
    document.getElementById('confirmationModal').style.display = 'none';
    selectedButton = null;
});

// Confirm button
document.getElementById('modalConfirm').addEventListener('click', async () => {
    if (!selectedButton) return;

    const userId = selectedButton.dataset.id;

    try {
        const res = await fetch('/admin/blockCustomer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId })
        });
        const data = await res.json();

        if (data.success) {
            const row = selectedButton.closest('tr');
            const statusCell = row.querySelector('.status');

            if (selectedButton.classList.contains('btn-block')) {
                selectedButton.classList.remove('btn-block');
                selectedButton.classList.add('btn-unblock');
                selectedButton.textContent = 'Unblock';
                selectedButton.dataset.status = 'unblock';
                statusCell.textContent = 'Blocked';
                statusCell.className = 'status blocked';
            } else {
                selectedButton.classList.remove('btn-unblock');
                selectedButton.classList.add('btn-block');
                selectedButton.textContent = 'Block';
                selectedButton.dataset.status = 'block';
                statusCell.textContent = 'Active';
                statusCell.className = 'status active';
            }
        } else {
            alert('Failed to update user status.');
        }
    } catch (err) {
        console.error(err);
        alert('Something went wrong!');
    } finally {
        document.getElementById('confirmationModal').style.display = 'none';
        selectedButton = null;
    }
});

