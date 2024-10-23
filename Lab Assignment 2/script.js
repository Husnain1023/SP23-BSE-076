const apiUrl = 'https://usmanlive.com/wp-json/api/stories';

// Helper function to make HTTP requests
function httpRequest(method, url, data, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = () => callback(JSON.parse(xhr.responseText));
  xhr.send(data ? JSON.stringify(data) : null);
}

// GET: Fetch all stories
function getStories() {
  httpRequest('GET', apiUrl, null, (response) => {
    const storyList = document.getElementById('storyList');
    storyList.innerHTML = '';
    response.forEach((story) => {
      const storyItem = document.createElement('div');
      storyItem.className = 'story-item';
      storyItem.innerHTML = `
        <span>ID: ${story.id} - ${story.title.rendered}</span>
        
      `;
      storyItem.innerHTML = `<span>ID: ${story.id} - ${story.title.rendered}</span>`;
      storyItem.innerHTML = `<span>ID: ${story.id} - ${story.content.rendered}</span>`;
      

      storyList.appendChild(storyItem);
    });
  });
}

// POST: Create a new story
function createStory() {
  const title = document.getElementById('storyTitle').value;
  const content = document.getElementById('storyContent').value;

  const data = { title: title, content: content };
  httpRequest('POST', apiUrl, data, (response) => {
    alert('Story created: ' + response.id);
    getStories(); // Refresh the list
  });
}

// PUT: Update an existing story
function updateStory() {
  const id = document.getElementById('storyId').value;
  const title = document.getElementById('storyTitle').value;
  const content = document.getElementById('storyContent').value;

  const data = { title: title, content: content };
  httpRequest('PUT', `${apiUrl}/${id}`, data, (response) => {
    alert('Story updated: ' + response.id);
    getStories(); // Refresh the list
  });
}

// DELETE: Delete a story by ID from the input field
function deleteStoryById() {
  const id = document.getElementById('storyId').value;

  if (!id) {
    alert('Please enter a valid ID to delete.');
    return;
  }

  httpRequest('DELETE', `${apiUrl}/${id}`, null, () => {
    alert(`Story with ID ${id} deleted.`);
    getStories(); // Refresh the list
  });
}
