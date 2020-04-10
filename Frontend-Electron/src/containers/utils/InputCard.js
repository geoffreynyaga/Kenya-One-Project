/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\utils\InputCard.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 10:58:00 am
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Friday April 10th 2020 10:58:00 am
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */

import React from "react";
import PropTypes from "prop-types";
import { Card, CardTitle } from "shards-react";

function InputCard(props) {
  return (
    <Card
      style={{
        backgroundColor: "#EFF0F0",
        marginTop: !props.top ? 20 : 0,
        ...props.style,
      }}
    >
      <CardTitle
        style={{
          textAlign: "center",
          fontSize: 14,
          alignContent: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {props.title}
      </CardTitle>

      {props.children}
    </Card>
  );
}

InputCard.propTypes = {
  top: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.element.isRequired,
  style: PropTypes.object,
};

export default InputCard;
