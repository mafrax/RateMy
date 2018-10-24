function link_slider(slider) {
    // console.log(/*)(slider);
    // console.log(/*)(slider.parentElement);
    var match = slider.id.match(/\d+/);
    var div_number = parseInt(match[0], 10);
    var brother = document.getElementById("sima" + div_number);
    // console.log(/*)(brother);
    // console.log(/*)(div_number);
    var counter = document.getElementById("counter" + div_number);
    // console.log(/*)(slider.value);
    counter.innerHTML = slider.value;
    brother.style.width = 50 + slider.value / 2 + "%";
    brother.style.opacity = 1;
}