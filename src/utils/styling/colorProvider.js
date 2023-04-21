class ColorProvider {
  constructor() {
    if (!ColorProvider.instance) {
      ColorProvider.instance = this;
    }

    // Use a perceptually uniform color scheme, with a lot of colors.
    this.colorPool = [
      '#3957ff', '#d3fe14', '#c9080a', '#fec7f8', '#0b7b3e', '#0bf0e9', '#c203c8', '#fd9b39', '#888593', '#906407', '#98ba7f', '#fe6794', '#10b0ff', '#ac7bff', '#fee7c0', '#964c63', '#1da49c', '#0ad811', '#bbd9fd', '#fe6cfe', '#297192', '#d1a09c', '#78579e', '#81ffad', '#739400', '#ca6949', '#d9bf01', '#646a58', '#d5097e', '#bb73a9', '#ccf6e9', '#9cb4b6', '#b6a7d4', '#9e8c62', '#6e83c8', '#01af64', '#a71afd', '#cfe589', '#d4ccd1', '#fd4109', '#bf8f0e', '#2f786e', '#4ed1a5', '#d8bb7d', '#a54509', '#6a9276', '#a4777a', '#fc12c9', '#606f15', '#3cc4d9', '#f31c4e', '#73616f', '#f097c6', '#fc8772', '#92a6fe', '#875b44', '#699ab3', '#94bc19', '#7d5bf0', '#d24dfe', '#c85b74', '#68ff57', '#b62347', '#994b91', '#646b8c', '#977ab4', '#d694fd', '#c4d5b5', '#fdc4bd', '#1cae05', '#7bd972', '#e9700a', '#d08f5d', '#8bb9e1', '#fde945', '#a29d98', '#1682fb', '#9ad9e0', '#d6cafe', '#8d8328', '#b091a7', '#647579', '#1f8d11', '#e7eafd', '#b9660b', '#a4a644', '#fec24c', '#b1168c', '#188cc1', '#7ab297', '#4468ae', '#c949a6', '#d48295', '#eb6dc2', '#d5b0cb', '#ff9ffb', '#fdb082', '#af4d44', '#a759c4', '#a9e03a', '#0d906b', '#9ee3bd', '#5b8846', '#0d8995', '#f25c58', '#70ae4f', '#847f74', '#9094bb', '#ffe2f1', '#a67149', '#936c8e', '#d04907', '#c3b8a6', '#cef8c4', '#7a9293', '#fda2ab', '#2ef6c5', '#807242', '#cb94cc', '#b6bdd0', '#b5c75d', '#fde189', '#b7ff80', '#fa2d8e', '#839a5f', '#28c2b5', '#e5e9e1', '#bc79d8', '#7ed8fe', '#9f20c3', '#4f7a5b', '#f511fd', '#09c959', '#bcd0ce', '#8685fd', '#98fcff', '#afbff9', '#6d69b4', '#5f99fd', '#aaa87e', '#b59dfb', '#5d809d', '#d9a742', '#ac5c86', '#9468d5', '#a4a2b2', '#b1376e', '#d43f3d', '#05a9d1', '#c38375', '#24b58e', '#6eabaf', '#66bf7f', '#92cbbb', '#ddb1ee', '#1be895', '#c7ecf9', '#a6baa6', '#8045cd', '#5f70f1', '#a9d796', '#ce62cb', '#0e954d', '#a97d2f', '#fcb8d3', '#9bfee3', '#4e8d84', '#fc6d3f', '#7b9fd4', '#8c6165', '#72805e', '#d53762', '#f00a1b', '#de5c97', '#8ea28b', '#fccd95', '#ba9c57', '#b79a82', '#7c5a82', '#7d7ca4', '#958ad6', '#cd8126', '#bdb0b7', '#10e0f8', '#dccc69', '#d6de0f', '#616d3d', '#985a25', '#30c7fd', '#0aeb65', '#e3cdb4', '#bd1bee', '#ad665d', '#d77070', '#8ea5b8', '#5b5ad0', '#76655e', '#598100', '#86757e', '#5ea068', '#a590b8', '#c1a707', '#85c0cd', '#e2cde9', '#dcd79c', '#d8a882', '#b256f9', '#b13323', '#519b3b', '#dd80de', '#f1884b', '#74b2fe', '#a0acd2', '#d199b0', '#f68392', '#8ccaa0', '#64d6cb', '#e0f86a', '#42707a', '#75671b', '#796e87', '#6d8075', '#9b8a8d', '#f04c71', '#61bd29', '#bcc18f', '#fecd0f', '#1e7ac9', '#927261', '#dc27cf', '#979605', '#ec9c88', '#8c48a3', '#676769', '#546e64', '#8f63a2', '#b35b2d', '#7b8ca2', '#b87188', '#4a9bda', '#eb7dab', '#f6a602', '#cab3fe', '#ddb8bb', '#107959', '#885973', '#5e858e', '#b15bad', '#e107a7', '#2f9dad', '#4b9e83', '#b992dc', '#6bb0cb', '#bdb363', '#ccd6e4', '#a3ee94', '#9ef718', '#fbe1d9', '#a428a5', '#93514c', '#487434', '#e8f1b6', '#d00938', '#fb50e1', '#fa85e1', '#7cd40a', '#f1ade1', '#b1485d', '#7f76d6', '#d186b3', '#90c25e', '#b8c813', '#a8c9de', '#7d30fe', '#815f2d', '#737f3b', '#c84486', '#946cfe', '#e55432', '#a88674', '#c17a47', '#b98b91', '#fc4bb3', '#da7f5f', '#df920b', '#b7bbba', '#99e6d9', '#a36170', '#c742d8', '#947f9d', '#a37d93', '#889072', '#9b924c', '#23b4bc', '#e6a25f', '#86df9c', '#a7da6c', '#3fee03', '#eec9d8', '#aafdcb', '#7b9139', '#92979c', '#72788a', '#994cff', '#c85956', '#7baa1a', '#de72fe', '#c7bad8', '#85ebfe', '#6e6089', '#9b4d31', '#297a1d', '#9052c0', '#5c75a5', '#698eba', '#d46222', '#6da095', '#b483bb', '#04d183', '#9bcdfe', '#2ffe8c', '#9d4279', '#c909aa', '#826cae', '#77787c', '#a96fb7', '#858f87', '#fd3b40', '#7fab7b', '#9e9edd', '#bba3be', '#f8b96c', '#7be553', '#c0e1ce', '#516e88', '#be0e5f', '#757c09', '#4b8d5f', '#38b448', '#df8780', '#ebb3a0', '#ced759', '#f0ed7c', '#e0eef1', '#0969d2', '#756446', '#488ea8', '#888450', '#61979c', '#a37ad6', '#b48a54', '#8193e5', '#dd6d89', '#8aa29d', '#c679fe', '#a4ac12', '#75bbb3', '#6ae2c1', '#c4fda7', '#606877', '#b2409d', '#5874c7', '#bf492c', '#4b88cd', '#e14ec0', '#b39da2', '#fb8300', '#d1b845', '#c2d083', '#c3caef', '#967500', '#c56399', '#ed5a05', '#aadff6', '#6685f4', '#1da16f', '#f28bff', '#c9c9bf', '#c7e2a9', '#5bfce4', '#e0e0bf', '#e8e2e8', '#ddf2d8', '#9108f8', '#932dd2', '#c03500', '#aa3fbc', '#547c79', '#9f6045', '#04897b', '#966f32', '#d83212', '#039f27', '#df4280', '#ef206e', '#0095f7', '#a5890d', '#9a8f7f', '#bc839e',
    ];
    this.nextColor = 0;
    return ColorProvider.instance;
  }

  getColor() {
    if (this.nextColor === this.colorPool.length) this.nextColor = 0;
    const color = this.colorPool[this.nextColor];
    this.nextColor += 1;
    return color;
  }
}

const instance = new ColorProvider();

export default instance;
