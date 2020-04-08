/*
 * File: c:\Projects\MFUKO\src\NATIVE\babel.config.js
 * Project: c:\Projects\MFUKO\src\NATIVE
 * Created Date: Saturday, July 20th 2019, 8:35:41 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Saturday July 20th 2019 8:35:41 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"]
  };
};
