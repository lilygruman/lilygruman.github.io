let page = document.querySelector('html');

page.onclick = function() {
    alert('Get OUT of my WEBSITE');
    page.onclick = function(){};
}

let button = document.querySelector('button');
let title = document.querySelector('title');

button.onclick = function() {
    title.textContent = 'Oh no you made it worse'
}