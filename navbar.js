window.onscroll = function() {myFunction()};
var navbar = document.getElementById("navbar");
var spacer = document.getElementById("spacer");
var sticky = navbar.offsetTop;
function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
    spacer.classList.add("spaced");
  } else { navbar.classList.remove("sticky");
           spacer.classList.remove("spaced");
  }
}