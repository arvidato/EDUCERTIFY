document.querySelectorAll('.view-button').forEach(button => {
    button.addEventListener('click', () => {
        const modal = document.getElementById('certificateModal');
        modal.classList.add('show');
    });
});

document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.certificate-modal');
        modal.classList.remove('show');
    });
});

// Close modal when clicking outside
document.querySelectorAll('.certificate-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}); 