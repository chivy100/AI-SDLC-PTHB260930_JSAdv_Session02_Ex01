
// BASE URL của DummyJSON API.
const BASE_URL = "https://dummyjson.com";


// 1. HÀM XÂY DỰNG QUERY STRING

function buildQuery(params = {}) {
  // Tạo đối tượng URLSearchParams để xây dựng query string.
  const searchParams = new URLSearchParams();

  // Duyệt qua từng cặp key và value trong object params.
  for (const [key, value] of Object.entries(params)) {
    // Bỏ qua undefined, null và chuỗi rỗng.
    // Giữ lại giá trị 0 vì 0 !== "".
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Thêm tham số vào URLSearchParams.
    // URLSearchParams tự động mã hóa ký tự đặc biệt.
    searchParams.append(key, value);
  }

  // Chuyển các tham số thành chuỗi query string.
  const queryString = searchParams.toString();

  // Nếu có tham số thì thêm dấu ? ở đầu, nếu không thì trả chuỗi rỗng.
  return queryString ? `?${queryString}` : "";
}


// 2. HÀM LẤY DANH SÁCH SẢN PHẨM

async function getProducts({ limit, skip, q, category } = {}) {
  // Khởi tạo endpoint mặc định để lấy danh sách sản phẩm.
  let endpoint = "/products";

  // Khởi tạo các query parameter dùng chung.
  let params = { limit, skip };

  // Ưu tiên tìm kiếm sản phẩm nếu có từ khóa q.
  if (q !== undefined && q !== null && q !== "") {
    endpoint = "/products/search";

    // Thêm từ khóa tìm kiếm vào query string.
    params = { q, limit, skip };
  }
  // Nếu không có q nhưng có category thì lọc theo danh mục.
  else if (category !== undefined && category !== null && category !== "") {
    // Mã hóa tên danh mục để đảm bảo an toàn cho URL.
    endpoint = `/products/category/${encodeURIComponent(category)}`;
  }

  // Kết hợp BASE_URL, endpoint và query string thành URL hoàn chỉnh.
  const url = BASE_URL + endpoint + buildQuery(params);

  // Gửi HTTP request đến API.
  const response = await fetch(url);

  // Kiểm tra trạng thái HTTP trước khi đọc dữ liệu JSON.
  if (!response.ok) {
    throw new Error(`Lỗi HTTP ${response.status}`);
  }

  // Chuyển dữ liệu JSON từ server thành object JavaScript.
  const data = await response.json();

  // Trả về đúng cấu trúc dữ liệu theo yêu cầu đề bài.
  return {
    products: data.products,
    total: data.total,
    skip: data.skip,
    limit: data.limit
  };
}


// 3. HÀM LẤY CHI TIẾT SẢN PHẨM

async function getProduct(id) {
  // Gửi request lấy chi tiết sản phẩm theo id.
  const response = await fetch(`${BASE_URL}/products/${id}`);

  // Kiểm tra nếu server trả về mã lỗi HTTP.
  if (!response.ok) {
    // Xử lý riêng trường hợp không tìm thấy sản phẩm.
    if (response.status === 404) {
      throw new Error(`Không tìm thấy sản phẩm có id ${id}`);
    }

    // Xử lý các mã lỗi HTTP khác.
    throw new Error(`Lỗi HTTP ${response.status}`);
  }

  // Chuyển dữ liệu JSON thành object JavaScript.
  return await response.json();
}


// 4. HÀM LẤY DANH SÁCH SẢN PHẨM THEO TRANG

async function getProductsPage(page, pageSize = 10) {
  // Kiểm tra page và pageSize phải là số nguyên từ 1 trở lên.
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new Error("Số trang không hợp lệ");
  }

  // Tính vị trí bắt đầu lấy sản phẩm.
  // Trang 1 bắt đầu từ vị trí 0, trang 2 bắt đầu từ vị trí 10.
  const skip = (page - 1) * pageSize;

  // Gọi getProducts đúng một lần để lấy dữ liệu của trang.
  return await getProducts({
    limit: pageSize,
    skip: skip
  });
}


// 5. HÀM MÔ TẢ VỊ TRÍ HIỂN THỊ SẢN PHẨM

function describePage(data) {
  // Lấy số lượng sản phẩm thực tế trong trang hiện tại.
  const productCount = data.products.length;

  // Nếu trang không có sản phẩm thì trả về thông báo tương ứng.
  if (productCount === 0) {
    return "Không có sản phẩm nào";
  }

  // Tính vị trí sản phẩm đầu tiên, bắt đầu đếm từ 1.
  const start = data.skip + 1;

  // Tính vị trí sản phẩm cuối cùng dựa trên số lượng thực tế.
  const end = data.skip + productCount;

  // Tạo nội dung mô tả vị trí hiển thị sản phẩm.
  return `Hiển thị ${start}-${end} trên tổng ${data.total} sản phẩm`;
}


// 6. TEST CASE: buildQuery()

console.log("===== TEST buildQuery() =====");

// Kiểm tra query có limit, skip bằng 0 và chuỗi rỗng.
console.log(buildQuery({ limit: 10, skip: 0, q: "" }));
// Expected: "?limit=10&skip=0"

// Kiểm tra tự động mã hóa dấu cách trong từ khóa tìm kiếm.
console.log(buildQuery({ q: "tai nghe" }));
// Expected: "?q=tai+nghe"

// Kiểm tra từ khóa có tiếng Việt.
console.log(buildQuery({ q: "điện thoại" }));
// Expected: "?q=điện+thoại" (thực tế chuỗi sẽ được mã hóa UTF-8)

// Kiểm tra không có tham số hợp lệ.
console.log(buildQuery({ limit: undefined, skip: null, q: "" }));
// Expected: ""


// 7. TEST CASE: getProducts()

console.log("===== TEST getProducts() =====");

// Kiểm tra tìm kiếm sản phẩm theo từ khóa phone.
getProducts({ q: "phone", limit: 3 })
  .then((data) => {
    console.log(data);
    // Expected: Object chứa products, total, skip, limit.
  })
  .catch((error) => {
    console.error(error.message);
  });

// Kiểm tra lọc sản phẩm theo danh mục smartphones.
getProducts({ category: "smartphones", limit: 5, skip: 0 })
  .then((data) => {
    console.log(data);
    // Expected: Danh sách sản phẩm thuộc smartphones.
  })
  .catch((error) => {
    console.error(error.message);
  });

// Kiểm tra lấy danh sách sản phẩm mặc định.
getProducts({ limit: 10, skip: 0 })
  .then((data) => {
    console.log(data);
    // Expected: Danh sách 10 sản phẩm đầu tiên.
  })
  .catch((error) => {
    console.error(error.message);
  });


// 8. TEST CASE: getProduct()

console.log("===== TEST getProduct() =====");

// Kiểm tra lấy chi tiết sản phẩm có id hợp lệ.
getProduct(1)
  .then((data) => {
    console.log(data);
    // Expected: Object chứa thông tin sản phẩm có id 1.
  })
  .catch((error) => {
    console.error(error.message);
  });

// Kiểm tra lấy sản phẩm không tồn tại.
getProduct(999999)
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error(error.message);
    // Expected: Không tìm thấy sản phẩm có id 999999.
  });


// 9. TEST CASE: getProductsPage()

console.log("===== TEST getProductsPage() =====");

// Kiểm tra lấy trang 1 với 10 sản phẩm.
getProductsPage(1, 10)
  .then((data) => {
    console.log(data);
    // Expected: limit = 10, skip = 0.
  })
  .catch((error) => {
    console.error(error.message);
  });

// Kiểm tra lấy trang 3 với 10 sản phẩm.
getProductsPage(3, 10)
  .then((data) => {
    console.log(data);
    // Expected: limit = 10, skip = 20.
  })
  .catch((error) => {
    console.error(error.message);
  });

// Kiểm tra số trang không hợp lệ.
getProductsPage(0, 10)
  .catch((error) => {
    console.log(error.message);
    // Expected: Số trang không hợp lệ.
  });


// 10. TEST CASE: describePage()

console.log("===== TEST describePage() =====");

// Kiểm tra trang có đủ 10 sản phẩm.
console.log(
  describePage({
    products: Array(10).fill({}),
    total: 194,
    skip: 0,
    limit: 10
  })
);
// Expected: Hiển thị 1-10 trên tổng 194 sản phẩm

// Kiểm tra trang cuối chỉ còn 4 sản phẩm.
console.log(
  describePage({
    products: Array(4).fill({}),
    total: 194,
    skip: 190,
    limit: 10
  })
);
// Expected: Hiển thị 191-194 trên tổng 194 sản phẩm

// Kiểm tra trang không có sản phẩm.
console.log(
  describePage({
    products: [],
    total: 194,
    skip: 194,
    limit: 10
  })
);
// Expected: Không có sản phẩm nào
