let page = document.querySelector('html');

button.onclick = function() {}
page.onclick = function() {
    alert('Get OUT of my WEBSITE');
    page.onclick = function(){};
    button.onclick = function() {
        title.textContent = 'Oh no you made it worse'
    }
}

let button = document.querySelector('button');
let title = document.querySelector('title');
