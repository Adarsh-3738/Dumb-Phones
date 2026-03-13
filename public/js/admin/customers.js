document.querySelectorAll('.btn-block, .btn-unblock').forEach(button => {

    button.addEventListener('click', async () => {

        const userId = button.dataset.id;
        const userName = button.dataset.name;
        const action = button.dataset.status;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You want to ${action} ${userName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes',
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/admin/${action}Customer`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId })
            });

            const data = await res.json();

            if (data.success) {

                const row = button.closest('tr');
                const statusCell = row.querySelector('.status');

                if (button.classList.contains('btn-block')) {
                    button.classList.remove('btn-block');
                    button.classList.add('btn-unblock');
                    button.textContent = 'Unblock';
                    button.dataset.status = 'unblock';
                    statusCell.textContent = 'Blocked';
                    statusCell.className = 'status blocked';
                } else {
                    button.classList.remove('btn-unblock');
                    button.classList.add('btn-block');
                    button.textContent = 'Block';
                    button.dataset.status = 'block';
                    statusCell.textContent = 'Active';
                    statusCell.className = 'status active';
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    timer: 1200,
                    showConfirmButton: false
                });

            } else {
                Swal.fire('Error', 'Failed to update user status', 'error');
            }

        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Something went wrong!', 'error');
        }
    });
});