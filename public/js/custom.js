// utility fucntions
function tempUnavalable(){
	alert("This feature is not avalable now..")
}

function sendOtp(instance) {
	// console.log(`i am sending an opt ${instance.style}`);
	alert("Otp verification is not avalable right now. Please use google authentication for now")


}

// this fucntion is for change bg for mobiles screen 
function changeBgMobile(x) {
	const bg_img = document.querySelector("#bg_img");
	if (bg_img != null) {
		if (x.matches) { // If media query matches  		
			bg_img.attributes.src.nodeValue = "images/bg-mobile.png"
		} else {
			bg_img.attributes.src.nodeValue = "images/bg.png"
		}
	}
}
var x = window.matchMedia("(max-width: 1000px)")
changeBgMobile(x) // Call listener function at run time
x.addListener(changeBgMobile) // Attach listener function on state changes








