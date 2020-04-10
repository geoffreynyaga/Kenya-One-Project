/*
 * File: c:\Projects\MFUKO\src\NATIVE\testSetup.js
 * Project: MFUKO
 * Author: geoff  at geoffrey@mfuko.co.ke
 * -----
 * Last Modified: Sunday September 29th 2019 2:54:46 pm
 * Modified By: geoff at geoffrey@mfuko.co.ke
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 *
 * Copyright (c) 2019 MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * HISTORY:
 */

// test-setup.js
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });
