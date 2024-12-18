function showProjectDescription(projectId) {
    // Hide the portfolio list and show the description container
    document.querySelector('header').style.display = 'none';
    document.querySelectorAll('.semester-projects').forEach(el => el.style.display = 'none');
    document.querySelector('footer').style.display = 'none';

    // Show the description container
    document.getElementById('description-container').style.display = 'block';

    // Set the description based on the project ID
    let description = '';
    if (projectId === 'project1') {
        description = 'This project showcases a responsive portfolio website that is optimized for mobile and desktop devices. It uses media queries, flexible layouts, and modern web design principles to ensure that the content is displayed correctly on various screen sizes.';
    } else if (projectId === 'project2') {
        description = 'The Task Manager app allows users to add, edit, and delete tasks. It was built using vanilla JavaScript, and it stores tasks locally in the browser\'s local storage. This way, the tasks persist even after the browser is closed.';
    } else if (projectId === 'project3') {
        description = 'The Online Bookstore project is an e-commerce website that allows users to browse books, read reviews, and make purchases. It features a shopping cart, secure checkout, and user account management, all built with HTML, CSS, and JavaScript.';
    }

    // Display the description
    document.getElementById('project-description').innerHTML = `<p>${description}</p>`;
}

function backToPortfolio() {
    // Show the portfolio list and hide the description container
    document.querySelector('header').style.display = 'block';
    document.querySelectorAll('.semester-projects').forEach(el => el.style.display = 'block');
    document.querySelector('footer').style.display = 'block';
    document.getElementById('description-container').style.display = 'none';
}
