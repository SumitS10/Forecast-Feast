const showMapButton = document.querySelector(".show-map-btn");

(function () {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const long = position.coords.longitude;

      console.log(lat, long);
      document
        .querySelector(".google-embedded-map")
        .setAttribute(
          "src",
          `https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d28292.405165910084!2d${long}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1srestaurants%20near%20me!5e0!3m2!1sen!2sin!4v1731850598060!5m2!1sen!2sin`
        );
    },
    (err) => {
      console.log("Error getting location", err);
    }
  );
})();

(function () {
  const delaySection = document.querySelector("#restaurantList");
  const delayResturants = document.querySelectorAll(".restaurant-card");

  window.setTimeout(() => {
    delaySection.classList.remove("hidden");
    delayResturants.forEach((el) => el.classList.remove("hidden"));
  }, 5000);
})();