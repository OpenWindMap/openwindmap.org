(function() {
  var createOrder, currentPage, fm, goToPage, nextPage, order, refreshCardPayment, refreshSummary, refreshThanks, textPriceTaxExc, textPriceTaxInc, validate, warranty;

  fm = function(amount, precision) {
    return accounting.formatMoney(amount, {
      symbol: "€",
      thousand: Lang.thousandFormat,
      decimal: Lang.decimalFormat,
      format: Lang.moneyFormat,
      precision: precision
    });
  };

  Stripe.setPublishableKey('pk_live_sBFTI4HgRd3cSwHLfr1mJBXs');

  order = {
    lang: Lang.lang,
    taxRate: 0.2,
    shippingTaxInc: 10,
    shippingDesc: Lang.shippingDescInvoice,
    pioupiouTaxInc: 399,
    pioupiouDesc: Lang.pioupiouDescInvoice,
    discountActive: false,
    discountRate: 0.10,
    discountDesc: Lang.discountDesc
  };

  order.shippingTaxExc = parseFloat(accounting.toFixed(order.shippingTaxInc / 120 * 100, 2));

  order.pioupiouTaxExc = parseFloat(accounting.toFixed(order.pioupiouTaxInc / 120 * 100, 2));

  if (order.discountActive) {
    order.discountTaxExc = parseFloat(accounting.toFixed(-order.pioupiouTaxExc * order.discountRate, 2));
    order.discountTaxInc = parseFloat(accounting.toFixed(order.discountTaxExc * 1.2, 2));
  } else {
    order.discountTaxExc = 0;
    order.discountTaxInc = 0;
  }

  nextPage = null;

  currentPage = "#productSelector";

  window.onbeforeunload = function() {
    if (currentPage !== "#productSelector" && currentPage !== "#thanks") {
      return "You have unsaved changes";
    }
  };

  goToPage = function(defaultPage, next) {
    var lastPage;
    lastPage = currentPage;
    if (nextPage === null) {
      currentPage = defaultPage;
    } else {
      currentPage = nextPage;
      nextPage = null;
    }
    if (next !== void 0) {
      nextPage = next;
    }
    $(lastPage).hide();
    $(currentPage).show();
    $(window).scrollTop(0, 0);
    if (currentPage === "#summary") {
      refreshSummary();
    } else if (currentPage === "#cardPayment") {
      refreshCardPayment();
    } else if (currentPage === "#thanks") {
      refreshThanks();
    }
    if (currentPage === "#productSelector" || currentPage === "#thanks" || currentPage === "#summary" || currentPage === "#cardPayment") {
      return $(".bottomNotice").hide();
    } else {
      return $(".bottomNotice").show();
    }
  };

  $(".btn.back").click(function() {
    return goToPage($(this).data("target"));
  });

  validate = function(form, checklist) {
    var error;
    $(form + " input").parent().removeClass("has-error");
    error = false;
    checklist.forEach(function(e) {
      if ($(e).val() === "") {
        $(e).parent().addClass("has-error");
        return error = true;
      }
    });
    if (error) {
      alert("Veuillez compléter le formulaire");
      return false;
    } else {
      return true;
    }
  };

  if (order.discountActive) {
    $("#productSelector .sale").text(order.discountDesc);
    textPriceTaxInc = "<span class='oldPrice'>" + accounting.toFixed(order.pioupiouTaxInc, 2) + "</span> " + accounting.toFixed(order.pioupiouTaxInc + order.discountTaxInc, 2) + " " + Lang.taxInc;
    textPriceTaxExc = "<span class='oldPrice'>" + accounting.toFixed(order.pioupiouTaxExc, 2) + "</span> " + accounting.toFixed(order.pioupiouTaxExc + order.discountTaxExc, 2) + " " + Lang.taxExc;
  } else {
    textPriceTaxInc = fm(order.pioupiouTaxInc + order.discountTaxInc, 2) + " " + Lang.taxInc;
    textPriceTaxExc = fm(order.pioupiouTaxExc + order.discountTaxExc, 2) + " " + Lang.taxExc;
  }

  $("#productSelector .priceTaxInc")[0].innerHTML = textPriceTaxInc;

  $("#productSelector .priceTaxExc")[0].innerHTML = textPriceTaxExc;

  $("#productSelector .order .submit").click(function() {
    return goToPage("#warranty");
  });

  warranty = [
    {
      desc: Lang.warrantyStandard,
      priceTaxInc: 0,
      priceTaxExc: 0
    }, {
      desc: Lang.warrantyLightning,
      priceTaxInc: parseFloat(accounting.toFixed(55 * 1.2, 2)),
      priceTaxExc: 55
    }, {
      desc: Lang.warrantyLightningTheft,
      priceTaxInc: parseFloat(accounting.toFixed(95 * 1.2, 2)),
      priceTaxExc: 95
    }
  ];

  $("#warranty .price1")[0].innerHTML = fm(warranty[1].priceTaxInc) + " " + Lang.taxInc + "<br>" + "<small>" + fm(warranty[1].priceTaxExc) + " " + Lang.taxExc + "<small>";

  $("#warranty .price2")[0].innerHTML = fm(warranty[2].priceTaxInc) + " " + Lang.taxInc + "<br>" + "<small>" + fm(warranty[2].priceTaxExc) + " " + Lang.taxExc + "<small>";

  $("#warranty .submit").click(function() {
    var warratyId;
    warratyId = $(this).data("warranty");
    order.warrantyDesc = warranty[warratyId].desc;
    order.warrantyTaxInc = warranty[warratyId].priceTaxInc;
    order.warrantyTaxExc = warranty[warratyId].priceTaxExc;
    order.warrantyId = warratyId;
    return goToPage("#contact");
  });

  $("#contact .submit").click(function() {
    var email, emailValid, smtpValid, url;
    if (!validate("#contact", ["#contact_name", "#contact_email", "#contact_phone"])) {
      return;
    }
    $("#contact .submit").hide();
    $("#contact .loading").show();
    emailValid = true;
    smtpValid = true;
    email = $("#contact_email").val();
    url = "https://api.openwindmap.org/v1/shop/email-check?email=" + email;
    return $.getJSON(url, function(response) {
      if (!response.format_valid) {
        $("#contact_email").parent().addClass("has-error");
        emailValid = false;
      }
      if (!response.smtp_check) {
        return smtpValid = false;
      }
    }).always(function() {
      $("#contact .loading").hide();
      $("#contact .submit").show();
      if (!emailValid) {
        alert("Vérifiez l'adresse email");
        return;
      }
      if (!smtpValid) {
        if (!confirm("Votre adresse email est-elle bien correcte ?\n" + email)) {
          return;
        }
      }
      $("#contact input").each(function(i, e) {
        return order[e.id] = e.value;
      });
      return goToPage("#invoicing");
    });
  });

  $("#invoicing .submit").click(function() {
    var url;
    if (!validate("#invoicing", ["#invoice_name", "#invoice_address1", "#invoice_postcode", "#invoice_city", "#invoice_country"])) {
      return;
    }
    $("#invoicing input").each(function(i, e) {
      return order[e.id] = e.value;
    });
    order.invoice_vat = $("#invoice_vat").val();
    order.invoice_country = $("#invoice_country").val();
    order.vatNumberValid = false;
    order.vatNumberCompany = "";
    order.noTaxes = false;
    if (order.invoice_country === "Switzerland" || order.invoice_country === "Andorra") {
      order.noTaxes = true;
    }
    if (order.invoice_vat !== "" && order.noTaxes === false && order.invoice_country !== "France" && order.invoice_country !== "Monaco") {
      $("#invoicing .loading").show();
      $("#invoicing .submit").hide();
      order.vatNumberValid = true;
      url = "https://api.openwindmap.org/v1/shop/vat-check?vat_number=" + order.invoice_vat;
      return $.getJSON(url, function(response) {
        if (!response.valid) {
          $("#invoice_vat").parent().addClass("has-error");
          return order.vatNumberValid = false;
        } else {
          return order.vatNumberCompany = response.company_name;
        }
      }).always(function() {
        $("#invoicing .loading").hide();
        $("#invoicing .submit").show();
        if (order.vatNumberValid) {
          order.noTaxes = true;
          return goToPage("#shipping");
        } else {
          return alert("Vérifiez le numéro de TVA");
        }
      });
    } else {
      return goToPage("#shipping");
    }
  });

  $("#shipping .submit").click(function() {
    if (!validate("#shipping", ["#shipping_name", "#shipping_address1", "#shipping_postcode", "#shipping_city", "#shipping_country"])) {
      return;
    }
    $("#shipping input").each(function(i, e) {
      return order[e.id] = e.value;
    });
    order.shipping_country = $("#shipping_country").val();
    return goToPage("#summary");
  });

  createOrder = function(order) {
    return $.post("https://api.openwindmap.org/v1/shop/order/create", order, (function(data, textStatus) {
      if (data.success) {
        $("#cardPayment input").val("");
        order.id = data.order_id;
        goToPage("#thanks");
        return;
      }
      if (data.outOfStock) {
        $("#cardPayment input").val("");
        alert("ERREUR : Stock insuffisant ou épuisé.\n\nLa commande ne peut pas être validée. Vous n'avez pas été débité.");
        goToPage("#summary");
        return;
      }
      if (data.stripe_error) {
        if (Lang.stripe[data.stripe_error.code]) {
          alert(Lang.stripe[data.stripe_error.code]);
        } else {
          alert("Le paiement a échoué");
        }
      } else {
        alert("Une erreur s'est produite. Ressayez");
      }
      return goToPage("#thanks");
    }), "json").always(function() {
      if (currentPage === "#cardPayment") {
        $("#cardPayment .submit").show();
        return $("#cardPayment .loading").hide();
      } else if (currentPage === "#summary") {
        $("#summary .paymentButtons").show();
        return $("#summary .loading").hide();
      }
    }).error(function() {
      return alert(Lang.errorRetry);
    });
  };

  $("#summary .edit").click(function() {
    return goToPage($(this).data("target"), "#summary");
  });

  $("#summary .submit").click(function() {
    if (!$("#accept-terms").is(":checked")) {
      alert("Veuillez accepter les conditions générales");
      return;
    }
    order.newsletter = $("#accept-newsletter").is(":checked");
    order.paymentMethod = $(this).data("payment");
    if (order.paymentMethod === "card") {
      return goToPage("#cardPayment");
    } else {
      $("#summary .paymentButtons").hide();
      $("#summary .loading").show();
      return createOrder(order);
    }
  });

  refreshSummary = function() {
    var taxFactor;
    order.quantity = parseInt($("#productSelector .quantity").val());
    $("#summary .quantity").text(order.quantity);
    $("#summary .pioupiouDesc").text(order.pioupiouDesc);
    $("#summary .warrantyDesc").text(order.warrantyDesc);
    $("#summary .shippingDesc").text(order.shippingDesc);
    order.pioupiouTotalTaxExc = order.pioupiouTaxExc * order.quantity;
    order.warrantyTotalTaxExc = order.warrantyTaxExc * order.quantity;
    order.discountTotalTaxExc = order.discountTaxExc * order.quantity;
    order.totalTaxExc = order.pioupiouTotalTaxExc + order.warrantyTotalTaxExc + order.discountTotalTaxExc + order.shippingTaxExc;
    order.totalTaxExc = parseFloat(accounting.toFixed(order.totalTaxExc, 2));
    order.totalTax = parseFloat(accounting.toFixed(order.totalTaxExc * 0.2, 2));
    order.totalTaxInc = order.totalTaxExc + order.totalTax;
    order.totalTaxInc = parseFloat(accounting.toFixed(order.totalTaxInc, 2));
    taxFactor = 1;
    if (order.noTaxes) {
      order.totalToPay = order.totalTaxExc;
      $("#summary .taxMode").text(Lang.taxExc);
      $("#summary .ttc").hide();
      $("#summary .ht").show();
    } else {
      order.totalToPay = order.totalTaxInc;
      $("#summary .taxMode").text(Lang.taxInc);
      $("#summary .ttc").show();
      $("#summary .ht").hide();
      taxFactor = 1.2;
    }
    if (order.discountActive) {
      $("#summary .discount").show();
      $("#summary .discountDesc").text(order.discountDesc);
      $("#summary .discountPrice").text(fm(order.discountTaxExc * taxFactor, 2));
      $("#summary .discountTotalPrice").text(fm(order.discountTotalTaxExc * taxFactor, 2));
    } else {
      $("#summary .discount").hide();
    }
    $("#summary .pioupiouPrice").text(fm(order.pioupiouTaxExc * taxFactor, 2));
    $("#summary .pioupiouTotalPrice").text(fm(order.pioupiouTotalTaxExc * taxFactor, 2));
    $("#summary .warrantyPrice").text(fm(order.warrantyTaxExc * taxFactor, 2));
    $("#summary .warrantyTotalPrice").text(fm(order.warrantyTotalTaxExc * taxFactor, 2));
    $("#summary .shippingPrice").text(fm(order.shippingTaxExc * taxFactor, 2));
    $("#summary .totalTaxInc").text(fm(order.totalTaxInc, 2));
    $("#summary .totalTaxExc").text(fm(order.totalTaxExc, 2));
    ["contact_name", "contact_email", "contact_phone", "invoice_name", "invoice_company", "invoice_address1", "invoice_address2", "invoice_postcode", "invoice_city", "invoice_country", "shipping_name", "shipping_company", "shipping_address1", "shipping_address2", "shipping_postcode", "shipping_city", "shipping_country", "invoice_vat", "vatNumberCompany"].forEach(function(field) {
      return $("#summary ." + field).text(order[field]);
    });
    if (order.vatNumberValid) {
      return $("#summary .vatNumber").show();
    } else {
      return $("#summary .vatNumber").hide();
    }
  };

  refreshCardPayment = function() {
    return $("#cardPayment .submit").text(Lang.pay + " " + fm(order.totalToPay, 2));
  };

  $("#cardPayment .submit").click(function() {
    var card;
    card = {
      number: $("#cardPayment .number").val(),
      exp_month: $("#cardPayment .exp_month").val(),
      exp_year: $("#cardPayment .exp_year").val(),
      cvc: $("#cardPayment .cvc").val()
    };
    if (!Stripe.card.validateCardNumber(card.number)) {
      $("#cardPayment .number").parent().addClass("has-error");
      alert("Veuillez vérifier les informations");
      return;
    }
    if (!Stripe.card.validateExpiry(card.exp_month, card.exp_year)) {
      $("#cardPayment .exp_month").parent().addClass("has-error");
      alert("Veuillez vérifier les informations");
      return;
    }
    if (!Stripe.card.validateCVC(card.cvc)) {
      $("#cardPayment .cvc").parent().addClass("has-error");
      alert("Veuillez vérifier les informations");
      return;
    }
    $("#cardPayment .submit").hide();
    $("#cardPayment .loading").show();
    return Stripe.card.createToken(card, function(status, response) {
      if (response.error) {
        if (response.error.code) {
          alert(Lang.stripe[response.error.code]);
        } else {
          alert("Une erreur s'est produite. Ressayez");
        }
        $("#cardPayment .submit").show();
        return $("#cardPayment .loading").hide();
      } else {
        card = null;
        $("#cardPayment input").val("");
        order.stripe_token = response.id;
        return createOrder(order);
      }
    });
  });

  refreshThanks = function() {
    var buttonText, url, urlEndPoint;
    $("#thanks .orderId").text(order.id);
    $("#thanks .email").text(order.contact_email);
    $("#thanks .amount").text(fm(order.totalToPay, 2));
    urlEndPoint = "/quotation";
    buttonText = Lang.printQuotation;
    if (order.paymentMethod === "card") {
      $("#thanks .card").show();
      buttonText = Lang.printInvoice;
      urlEndPoint = "/invoice";
    } else if (order.paymentMethod === "check") {
      $("#thanks .check").show();
    } else if (order.paymentMethod === "transfer") {
      $("#thanks .transfer").show();
    }
    url = "https://pioupiou.fr/" + Lang.lang + urlEndPoint + "?order=" + order.id + "&email=" + order.contact_email;
    return $("#thanks .invoiceButton").attr("href", url).text(buttonText);
  };

  $(".newsletter .submit").click(function() {
    var data, email;
    email = $(".newsletter .email").val();
    if (email === "") {
      alert(Lang.pleaseFillTheForm);
      return;
    }
    $(".newsletter .submit").hide();
    $(".newsletter .loading").show();
    data = {
      email: email,
      lang: Lang.lang
    };
    return $.post("https://api.openwindmap.org/v1/shop/newsletter", data, (function(response, textStatus) {
      console.log(response);
      if (response.error) {
        alert(Lang.errorRetry);
      } else {
        alert(Lang.successNewsletter + email);
        $(".newsletter .email").val("");
      }
      $(".submit").show();
      return $(".loading").hide();
    }), "json").error(function() {
      alert(Lang.errorRetry);
      $(".submit").show();
      return $(".loading").hide();
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,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LCJmaWxlIjoib3JkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJmbSA9IChhbW91bnQsIHByZWNpc2lvbikgLT5cbiAgYWNjb3VudGluZy5mb3JtYXRNb25leSBhbW91bnQsIHtcbiAgICBzeW1ib2w6IFwi4oKsXCJcbiAgICB0aG91c2FuZDogTGFuZy50aG91c2FuZEZvcm1hdFxuICAgIGRlY2ltYWw6IExhbmcuZGVjaW1hbEZvcm1hdFxuICAgIGZvcm1hdDogTGFuZy5tb25leUZvcm1hdFxuICAgIHByZWNpc2lvbjogcHJlY2lzaW9uXG4gIH1cblxuIyA9PT09IHNldHRpbmdzID09PT09PT09PT1cblxuU3RyaXBlLnNldFB1Ymxpc2hhYmxlS2V5KCdwa19saXZlX3NCRlRJNEhnUmQzY1N3SExmcjFtSkJYcycpXG5cbm9yZGVyID0ge1xuICBsYW5nOiBMYW5nLmxhbmdcbiAgdGF4UmF0ZTogMC4yXG4gIHNoaXBwaW5nVGF4SW5jOiAxMFxuICBzaGlwcGluZ0Rlc2M6IExhbmcuc2hpcHBpbmdEZXNjSW52b2ljZVxuICBwaW91cGlvdVRheEluYzogMzk5XG4gIHBpb3VwaW91RGVzYzogTGFuZy5waW91cGlvdURlc2NJbnZvaWNlXG4gIGRpc2NvdW50QWN0aXZlOiBmYWxzZVxuICBkaXNjb3VudFJhdGU6IDAuMTBcbiAgZGlzY291bnREZXNjOiBMYW5nLmRpc2NvdW50RGVzY1xufVxuXG5vcmRlci5zaGlwcGluZ1RheEV4YyA9IHBhcnNlRmxvYXQoYWNjb3VudGluZy50b0ZpeGVkKG9yZGVyLnNoaXBwaW5nVGF4SW5jIC8gMTIwICogMTAwLCAyKSlcbm9yZGVyLnBpb3VwaW91VGF4RXhjID0gcGFyc2VGbG9hdChhY2NvdW50aW5nLnRvRml4ZWQob3JkZXIucGlvdXBpb3VUYXhJbmMgLyAxMjAgKiAxMDAsIDIpKVxuaWYgb3JkZXIuZGlzY291bnRBY3RpdmVcbiAgb3JkZXIuZGlzY291bnRUYXhFeGMgPSBwYXJzZUZsb2F0KGFjY291bnRpbmcudG9GaXhlZCgtIG9yZGVyLnBpb3VwaW91VGF4RXhjICogb3JkZXIuZGlzY291bnRSYXRlLCAyKSlcbiAgb3JkZXIuZGlzY291bnRUYXhJbmMgPSBwYXJzZUZsb2F0KGFjY291bnRpbmcudG9GaXhlZChvcmRlci5kaXNjb3VudFRheEV4YyAqIDEuMiwgMikpXG5lbHNlXG4gIG9yZGVyLmRpc2NvdW50VGF4RXhjID0gMFxuICBvcmRlci5kaXNjb3VudFRheEluYyA9IDBcblxuIyA9PT09IHJ1bnRpbWUgPT09PT1cblxubmV4dFBhZ2UgPSBudWxsXG5jdXJyZW50UGFnZSA9IFwiI3Byb2R1Y3RTZWxlY3RvclwiXG5cblxud2luZG93Lm9uYmVmb3JldW5sb2FkID0gKCkgLT5cbiAgaWYgY3VycmVudFBhZ2UgIT0gXCIjcHJvZHVjdFNlbGVjdG9yXCIgYW5kIGN1cnJlbnRQYWdlICE9IFwiI3RoYW5rc1wiXG4gICAgcmV0dXJuIFwiWW91IGhhdmUgdW5zYXZlZCBjaGFuZ2VzXCJcblxuZ29Ub1BhZ2UgPSAoZGVmYXVsdFBhZ2UsIG5leHQpIC0+XG4gIGxhc3RQYWdlID0gY3VycmVudFBhZ2VcbiAgaWYgbmV4dFBhZ2UgaXMgbnVsbFxuICAgIGN1cnJlbnRQYWdlID0gZGVmYXVsdFBhZ2VcbiAgZWxzZVxuICAgIGN1cnJlbnRQYWdlID0gbmV4dFBhZ2VcbiAgICBuZXh0UGFnZSA9IG51bGxcbiAgdW5sZXNzIG5leHQgaXMgdW5kZWZpbmVkXG4gICAgbmV4dFBhZ2UgPSBuZXh0XG4gICQobGFzdFBhZ2UpLmhpZGUoKVxuICAkKGN1cnJlbnRQYWdlKS5zaG93KClcbiAgJCh3aW5kb3cpLnNjcm9sbFRvcCgwLCAwKVxuICBpZiBjdXJyZW50UGFnZSA9PSBcIiNzdW1tYXJ5XCJcbiAgICByZWZyZXNoU3VtbWFyeSgpXG4gIGVsc2UgaWYgY3VycmVudFBhZ2UgPT0gXCIjY2FyZFBheW1lbnRcIlxuICAgIHJlZnJlc2hDYXJkUGF5bWVudCgpXG4gIGVsc2UgaWYgY3VycmVudFBhZ2UgPT0gXCIjdGhhbmtzXCJcbiAgICByZWZyZXNoVGhhbmtzKClcblxuICBpZiBjdXJyZW50UGFnZSA9PSBcIiNwcm9kdWN0U2VsZWN0b3JcIiBcXFxuICBvciBjdXJyZW50UGFnZSA9PSBcIiN0aGFua3NcIiBcXFxuICBvciBjdXJyZW50UGFnZSA9PSBcIiNzdW1tYXJ5XCIgXFxcbiAgb3IgY3VycmVudFBhZ2UgPT0gXCIjY2FyZFBheW1lbnRcIlxuICAgICQoXCIuYm90dG9tTm90aWNlXCIpLmhpZGUoKVxuICBlbHNlXG4gICAgJChcIi5ib3R0b21Ob3RpY2VcIikuc2hvdygpXG5cbiQoXCIuYnRuLmJhY2tcIikuY2xpY2sgKCktPlxuICBnb1RvUGFnZSgkKHRoaXMpLmRhdGEoXCJ0YXJnZXRcIikpXG5cblxudmFsaWRhdGUgPSAoZm9ybSwgY2hlY2tsaXN0KSAtPlxuICAkKGZvcm0gKyBcIiBpbnB1dFwiKS5wYXJlbnQoKS5yZW1vdmVDbGFzcyhcImhhcy1lcnJvclwiKVxuICBlcnJvciA9IGZhbHNlXG4gIGNoZWNrbGlzdC5mb3JFYWNoIChlKSAtPlxuICAgIGlmICQoZSkudmFsKCkgPT0gXCJcIlxuICAgICAgJChlKS5wYXJlbnQoKS5hZGRDbGFzcyhcImhhcy1lcnJvclwiKVxuICAgICAgZXJyb3IgPSB0cnVlXG4gIGlmIGVycm9yXG4gICAgYWxlcnQoXCJWZXVpbGxleiBjb21wbMOpdGVyIGxlIGZvcm11bGFpcmVcIilcbiAgICByZXR1cm4gZmFsc2VcbiAgZWxzZVxuICAgIHJldHVybiB0cnVlXG5cbiMgPT09PSBwcm9kdWN0U2VsZWN0b3IgPT09PT09PT09PVxuXG5pZiBvcmRlci5kaXNjb3VudEFjdGl2ZVxuICAkKFwiI3Byb2R1Y3RTZWxlY3RvciAuc2FsZVwiKS50ZXh0KG9yZGVyLmRpc2NvdW50RGVzYylcbiAgdGV4dFByaWNlVGF4SW5jID0gXCI8c3BhbiBjbGFzcz0nb2xkUHJpY2UnPlwiIFxcXG4gICAgICAgICAgICAgICAgICArIGFjY291bnRpbmcudG9GaXhlZChvcmRlci5waW91cGlvdVRheEluYywgMikgXFxcbiAgICAgICAgICAgICAgICAgICsgXCI8L3NwYW4+IFwiIFxcXG4gICAgICAgICAgICAgICAgICArIGFjY291bnRpbmcudG9GaXhlZChvcmRlci5waW91cGlvdVRheEluYyArIG9yZGVyLmRpc2NvdW50VGF4SW5jLCAyKSBcXFxuICAgICAgICAgICAgICAgICAgKyBcIiBcIiArIExhbmcudGF4SW5jXG4gIHRleHRQcmljZVRheEV4YyA9IFwiPHNwYW4gY2xhc3M9J29sZFByaWNlJz5cIiBcXFxuICAgICAgICAgICAgICAgICsgYWNjb3VudGluZy50b0ZpeGVkKG9yZGVyLnBpb3VwaW91VGF4RXhjLCAyKSBcXFxuICAgICAgICAgICAgICAgICsgXCI8L3NwYW4+IFwiIFxcXG4gICAgICAgICAgICAgICAgKyBhY2NvdW50aW5nLnRvRml4ZWQob3JkZXIucGlvdXBpb3VUYXhFeGMgKyBvcmRlci5kaXNjb3VudFRheEV4YywgMikgXFxcbiAgICAgICAgICAgICAgICArIFwiIFwiICsgTGFuZy50YXhFeGNcblxuZWxzZVxuICB0ZXh0UHJpY2VUYXhJbmMgPSBmbShvcmRlci5waW91cGlvdVRheEluYyArIG9yZGVyLmRpc2NvdW50VGF4SW5jLCAyKSBcXFxuICAgICAgICAgICAgICAgICAgKyBcIiBcIiArIExhbmcudGF4SW5jXG4gIHRleHRQcmljZVRheEV4YyA9IGZtKG9yZGVyLnBpb3VwaW91VGF4RXhjICsgb3JkZXIuZGlzY291bnRUYXhFeGMsIDIpIFxcXG4gICAgICAgICAgICAgICAgKyBcIiBcIiArIExhbmcudGF4RXhjXG5cbiQoXCIjcHJvZHVjdFNlbGVjdG9yIC5wcmljZVRheEluY1wiKVswXS5pbm5lckhUTUwgPSB0ZXh0UHJpY2VUYXhJbmNcbiQoXCIjcHJvZHVjdFNlbGVjdG9yIC5wcmljZVRheEV4Y1wiKVswXS5pbm5lckhUTUwgPSB0ZXh0UHJpY2VUYXhFeGNcblxuJChcIiNwcm9kdWN0U2VsZWN0b3IgLm9yZGVyIC5zdWJtaXRcIikuY2xpY2sgKCkgLT5cbiAgZ29Ub1BhZ2UoXCIjd2FycmFudHlcIilcblxuIyA9PT09PSB3YXJyYW50eSA9PT09PT09PT1cblxud2FycmFudHkgPSBbXG4gICAgZGVzYzogTGFuZy53YXJyYW50eVN0YW5kYXJkXG4gICAgcHJpY2VUYXhJbmM6IDBcbiAgICBwcmljZVRheEV4YzogMFxuICAsXG4gICAgZGVzYzogTGFuZy53YXJyYW50eUxpZ2h0bmluZ1xuICAgIHByaWNlVGF4SW5jOiBwYXJzZUZsb2F0KGFjY291bnRpbmcudG9GaXhlZCg1NSAqIDEuMiwgMikpXG4gICAgcHJpY2VUYXhFeGM6IDU1XG4gICxcbiAgICBkZXNjOiBMYW5nLndhcnJhbnR5TGlnaHRuaW5nVGhlZnRcbiAgICBwcmljZVRheEluYzogcGFyc2VGbG9hdChhY2NvdW50aW5nLnRvRml4ZWQoOTUgKiAxLjIsIDIpKVxuICAgIHByaWNlVGF4RXhjOiA5NVxuXVxuXG4kKFwiI3dhcnJhbnR5IC5wcmljZTFcIilbMF0uaW5uZXJIVE1MID0gXFxcbiAgZm0od2FycmFudHlbMV0ucHJpY2VUYXhJbmMpICsgXCIgXCIgKyBMYW5nLnRheEluYyArIFwiPGJyPlwiICsgXFxcbiAgXCI8c21hbGw+XCIgKyBmbSh3YXJyYW50eVsxXS5wcmljZVRheEV4YykgKyBcIiBcIiArIExhbmcudGF4RXhjICsgXCI8c21hbGw+XCJcblxuJChcIiN3YXJyYW50eSAucHJpY2UyXCIpWzBdLmlubmVySFRNTCA9IFxcXG4gIGZtKHdhcnJhbnR5WzJdLnByaWNlVGF4SW5jKSArIFwiIFwiICsgTGFuZy50YXhJbmMgKyBcIjxicj5cIiArIFxcXG4gIFwiPHNtYWxsPlwiICsgZm0od2FycmFudHlbMl0ucHJpY2VUYXhFeGMpICsgXCIgXCIgKyBMYW5nLnRheEV4YyArIFwiPHNtYWxsPlwiXG5cblxuJChcIiN3YXJyYW50eSAuc3VibWl0XCIpLmNsaWNrICgpIC0+XG4gIHdhcnJhdHlJZCA9ICQodGhpcykuZGF0YShcIndhcnJhbnR5XCIpXG4gIG9yZGVyLndhcnJhbnR5RGVzYyA9IHdhcnJhbnR5W3dhcnJhdHlJZF0uZGVzY1xuICBvcmRlci53YXJyYW50eVRheEluYyA9IHdhcnJhbnR5W3dhcnJhdHlJZF0ucHJpY2VUYXhJbmNcbiAgb3JkZXIud2FycmFudHlUYXhFeGMgPSB3YXJyYW50eVt3YXJyYXR5SWRdLnByaWNlVGF4RXhjXG4gIG9yZGVyLndhcnJhbnR5SWQgPSB3YXJyYXR5SWRcbiAgZ29Ub1BhZ2UoXCIjY29udGFjdFwiKVxuXG4jID09PT09IGNvbnRhY3QgPT09PT09PT09XG5cbiQoXCIjY29udGFjdCAuc3VibWl0XCIpLmNsaWNrICgpIC0+XG5cbiAgcmV0dXJuIHVubGVzcyB2YWxpZGF0ZSBcIiNjb250YWN0XCIsIFtcbiAgICBcIiNjb250YWN0X25hbWVcIlxuICAgIFwiI2NvbnRhY3RfZW1haWxcIlxuICAgIFwiI2NvbnRhY3RfcGhvbmVcIlxuICBdXG4gICQoXCIjY29udGFjdCAuc3VibWl0XCIpLmhpZGUoKVxuICAkKFwiI2NvbnRhY3QgLmxvYWRpbmdcIikuc2hvdygpXG5cbiAgZW1haWxWYWxpZCA9IHRydWVcbiAgc210cFZhbGlkID0gdHJ1ZVxuICBlbWFpbCA9ICQoXCIjY29udGFjdF9lbWFpbFwiKS52YWwoKVxuICB1cmwgPSBcImh0dHBzOi8vYXBpLnBpb3VwaW91LmZyL3YxL3Nob3AvZW1haWwtY2hlY2s/ZW1haWw9XCIgXFxcbiAgICAgICsgZW1haWxcbiAgJC5nZXRKU09OIHVybCwgKHJlc3BvbnNlKSAtPlxuICAgIHVubGVzcyByZXNwb25zZS5mb3JtYXRfdmFsaWRcbiAgICAgICQoXCIjY29udGFjdF9lbWFpbFwiKS5wYXJlbnQoKS5hZGRDbGFzcyhcImhhcy1lcnJvclwiKVxuICAgICAgZW1haWxWYWxpZCA9IGZhbHNlXG4gICAgdW5sZXNzIHJlc3BvbnNlLnNtdHBfY2hlY2tcbiAgICAgIHNtdHBWYWxpZCA9IGZhbHNlXG4gIC5hbHdheXMgKCkgLT5cbiAgICAkKFwiI2NvbnRhY3QgLmxvYWRpbmdcIikuaGlkZSgpXG4gICAgJChcIiNjb250YWN0IC5zdWJtaXRcIikuc2hvdygpXG4gICAgdW5sZXNzIGVtYWlsVmFsaWRcbiAgICAgIGFsZXJ0KFwiVsOpcmlmaWV6IGwnYWRyZXNzZSBlbWFpbFwiKVxuICAgICAgcmV0dXJuXG4gICAgdW5sZXNzIHNtdHBWYWxpZFxuICAgICAgcmV0dXJuIHVubGVzcyBjb25maXJtKFwiVm90cmUgYWRyZXNzZSBlbWFpbCBlc3QtZWxsZSBiaWVuIGNvcnJlY3RlID9cXG5cIitlbWFpbClcblxuICAgICQoXCIjY29udGFjdCBpbnB1dFwiKS5lYWNoIChpLCBlKSAtPlxuICAgICAgb3JkZXJbZS5pZF0gPSBlLnZhbHVlXG4gICAgZ29Ub1BhZ2UoXCIjaW52b2ljaW5nXCIpXG5cblxuXG4jID09PT09IGludm9pY2luZyA9PT09PT09PT1cblxuJChcIiNpbnZvaWNpbmcgLnN1Ym1pdFwiKS5jbGljayAoKSAtPlxuICByZXR1cm4gdW5sZXNzIHZhbGlkYXRlIFwiI2ludm9pY2luZ1wiLCBbXG4gICAgXCIjaW52b2ljZV9uYW1lXCJcbiAgICBcIiNpbnZvaWNlX2FkZHJlc3MxXCJcbiAgICBcIiNpbnZvaWNlX3Bvc3Rjb2RlXCJcbiAgICBcIiNpbnZvaWNlX2NpdHlcIlxuICAgIFwiI2ludm9pY2VfY291bnRyeVwiXG4gIF1cblxuXG5cbiAgJChcIiNpbnZvaWNpbmcgaW5wdXRcIikuZWFjaCAoaSwgZSkgLT5cbiAgICBvcmRlcltlLmlkXSA9IGUudmFsdWVcblxuICBvcmRlci5pbnZvaWNlX3ZhdCA9ICQoXCIjaW52b2ljZV92YXRcIikudmFsKClcbiAgb3JkZXIuaW52b2ljZV9jb3VudHJ5ID0gJChcIiNpbnZvaWNlX2NvdW50cnlcIikudmFsKClcbiAgb3JkZXIudmF0TnVtYmVyVmFsaWQgPSBmYWxzZVxuICBvcmRlci52YXROdW1iZXJDb21wYW55ID0gXCJcIlxuXG4gIG9yZGVyLm5vVGF4ZXMgPSBmYWxzZVxuICBpZiBvcmRlci5pbnZvaWNlX2NvdW50cnkgPT0gXCJTd2l0emVybGFuZFwiIG9yIG9yZGVyLmludm9pY2VfY291bnRyeSA9PSBcIkFuZG9ycmFcIlxuICAgIG9yZGVyLm5vVGF4ZXMgPSB0cnVlXG5cbiAgaWYgb3JkZXIuaW52b2ljZV92YXQgIT0gXCJcIiBhbmQgb3JkZXIubm9UYXhlcyA9PSBmYWxzZSBhbmQgb3JkZXIuaW52b2ljZV9jb3VudHJ5ICE9IFwiRnJhbmNlXCIgYW5kIG9yZGVyLmludm9pY2VfY291bnRyeSAhPSBcIk1vbmFjb1wiXG4gICAgJChcIiNpbnZvaWNpbmcgLmxvYWRpbmdcIikuc2hvdygpXG4gICAgJChcIiNpbnZvaWNpbmcgLnN1Ym1pdFwiKS5oaWRlKClcbiAgICBvcmRlci52YXROdW1iZXJWYWxpZCA9IHRydWVcbiAgICB1cmwgPSBcImh0dHBzOi8vYXBpLnBpb3VwaW91LmZyL3YxL3Nob3AvdmF0LWNoZWNrP3ZhdF9udW1iZXI9XCIgXFxcbiAgICAgICAgKyBvcmRlci5pbnZvaWNlX3ZhdFxuICAgICQuZ2V0SlNPTiB1cmwsIChyZXNwb25zZSkgLT5cbiAgICAgIHVubGVzcyByZXNwb25zZS52YWxpZFxuICAgICAgICAkKFwiI2ludm9pY2VfdmF0XCIpLnBhcmVudCgpLmFkZENsYXNzKFwiaGFzLWVycm9yXCIpXG4gICAgICAgIG9yZGVyLnZhdE51bWJlclZhbGlkID0gZmFsc2VcbiAgICAgIGVsc2VcbiAgICAgICAgb3JkZXIudmF0TnVtYmVyQ29tcGFueSA9IHJlc3BvbnNlLmNvbXBhbnlfbmFtZVxuICAgIC5hbHdheXMgKCkgLT5cbiAgICAgICQoXCIjaW52b2ljaW5nIC5sb2FkaW5nXCIpLmhpZGUoKVxuICAgICAgJChcIiNpbnZvaWNpbmcgLnN1Ym1pdFwiKS5zaG93KClcbiAgICAgIGlmIG9yZGVyLnZhdE51bWJlclZhbGlkXG4gICAgICAgIG9yZGVyLm5vVGF4ZXMgPSB0cnVlXG4gICAgICAgIGdvVG9QYWdlKFwiI3NoaXBwaW5nXCIpXG4gICAgICBlbHNlXG4gICAgICAgIGFsZXJ0KFwiVsOpcmlmaWV6IGxlIG51bcOpcm8gZGUgVFZBXCIpXG4gIGVsc2VcbiAgICBnb1RvUGFnZShcIiNzaGlwcGluZ1wiKVxuXG4jID09PT09IHNoaXBwaW5nID09PT09PT09PVxuXG4kKFwiI3NoaXBwaW5nIC5zdWJtaXRcIikuY2xpY2sgKCkgLT5cbiAgcmV0dXJuIHVubGVzcyB2YWxpZGF0ZSBcIiNzaGlwcGluZ1wiLCBbXG4gICAgXCIjc2hpcHBpbmdfbmFtZVwiXG4gICAgXCIjc2hpcHBpbmdfYWRkcmVzczFcIlxuICAgIFwiI3NoaXBwaW5nX3Bvc3Rjb2RlXCJcbiAgICBcIiNzaGlwcGluZ19jaXR5XCJcbiAgICBcIiNzaGlwcGluZ19jb3VudHJ5XCJcbiAgXVxuXG4gICQoXCIjc2hpcHBpbmcgaW5wdXRcIikuZWFjaCAoaSwgZSkgLT5cbiAgICBvcmRlcltlLmlkXSA9IGUudmFsdWVcblxuICBvcmRlci5zaGlwcGluZ19jb3VudHJ5ID0gJChcIiNzaGlwcGluZ19jb3VudHJ5XCIpLnZhbCgpXG5cbiAgZ29Ub1BhZ2UoXCIjc3VtbWFyeVwiKVxuXG5cbiMgPT09PT0gc3VtbWFyeSA9PT09PT09PT1cblxuY3JlYXRlT3JkZXIgPSAob3JkZXIpIC0+XG4gICQucG9zdCBcImh0dHBzOi8vYXBpLnBpb3VwaW91LmZyL3YxL3Nob3Avb3JkZXIvY3JlYXRlXCIsIG9yZGVyLCAoKGRhdGEsIHRleHRTdGF0dXMpIC0+XG4gICAgaWYgZGF0YS5zdWNjZXNzXG4gICAgICAkKFwiI2NhcmRQYXltZW50IGlucHV0XCIpLnZhbChcIlwiKVxuICAgICAgb3JkZXIuaWQgPSBkYXRhLm9yZGVyX2lkXG4gICAgICBnb1RvUGFnZShcIiN0aGFua3NcIilcbiAgICAgIHJldHVyblxuXG4gICAgaWYgZGF0YS5vdXRPZlN0b2NrXG4gICAgICAkKFwiI2NhcmRQYXltZW50IGlucHV0XCIpLnZhbChcIlwiKVxuICAgICAgYWxlcnQgXCJcIlwiXG4gICAgICBFUlJFVVIgOiBTdG9jayBpbnN1ZmZpc2FudCBvdSDDqXB1aXPDqS5cblxuICAgICAgTGEgY29tbWFuZGUgbmUgcGV1dCBwYXMgw6p0cmUgdmFsaWTDqWUuIFZvdXMgbidhdmV6IHBhcyDDqXTDqSBkw6liaXTDqS5cbiAgICAgIFwiXCJcIlxuICAgICAgZ29Ub1BhZ2UoXCIjc3VtbWFyeVwiKVxuICAgICAgcmV0dXJuXG5cblxuICAgIGlmIGRhdGEuc3RyaXBlX2Vycm9yXG4gICAgICBpZiBMYW5nLnN0cmlwZVtkYXRhLnN0cmlwZV9lcnJvci5jb2RlXVxuICAgICAgICBhbGVydCBMYW5nLnN0cmlwZVtkYXRhLnN0cmlwZV9lcnJvci5jb2RlXVxuICAgICAgZWxzZVxuICAgICAgICBhbGVydCBcIkxlIHBhaWVtZW50IGEgw6ljaG91w6lcIlxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiVW5lIGVycmV1ciBzJ2VzdCBwcm9kdWl0ZS4gUmVzc2F5ZXpcIlxuXG4gICAgZ29Ub1BhZ2UoXCIjdGhhbmtzXCIpXG4gICksIFwianNvblwiXG4gIC5hbHdheXMgKCktPlxuICAgIGlmIGN1cnJlbnRQYWdlID09IFwiI2NhcmRQYXltZW50XCJcbiAgICAgICQoXCIjY2FyZFBheW1lbnQgLnN1Ym1pdFwiKS5zaG93KClcbiAgICAgICQoXCIjY2FyZFBheW1lbnQgLmxvYWRpbmdcIikuaGlkZSgpXG4gICAgZWxzZSBpZiBjdXJyZW50UGFnZSA9PSBcIiNzdW1tYXJ5XCJcbiAgICAgICQoXCIjc3VtbWFyeSAucGF5bWVudEJ1dHRvbnNcIikuc2hvdygpXG4gICAgICAkKFwiI3N1bW1hcnkgLmxvYWRpbmdcIikuaGlkZSgpXG4gIC5lcnJvciAoKSAtPlxuICAgIGFsZXJ0IExhbmcuZXJyb3JSZXRyeVxuXG4kKFwiI3N1bW1hcnkgLmVkaXRcIikuY2xpY2sgKCkgLT5cbiAgZ29Ub1BhZ2UoJCh0aGlzKS5kYXRhKFwidGFyZ2V0XCIpLCBcIiNzdW1tYXJ5XCIpXG5cbiQoXCIjc3VtbWFyeSAuc3VibWl0XCIpLmNsaWNrICgpIC0+XG4gIHVubGVzcyAkKFwiI2FjY2VwdC10ZXJtc1wiKS5pcyhcIjpjaGVja2VkXCIpXG4gICAgYWxlcnQoXCJWZXVpbGxleiBhY2NlcHRlciBsZXMgY29uZGl0aW9ucyBnw6luw6lyYWxlc1wiKVxuICAgIHJldHVyblxuXG4gIG9yZGVyLm5ld3NsZXR0ZXIgPSAkKFwiI2FjY2VwdC1uZXdzbGV0dGVyXCIpLmlzKFwiOmNoZWNrZWRcIilcblxuICBvcmRlci5wYXltZW50TWV0aG9kID0gJCh0aGlzKS5kYXRhKFwicGF5bWVudFwiKVxuICBpZiBvcmRlci5wYXltZW50TWV0aG9kID09IFwiY2FyZFwiXG4gICAgZ29Ub1BhZ2UoXCIjY2FyZFBheW1lbnRcIilcbiAgZWxzZVxuICAgICQoXCIjc3VtbWFyeSAucGF5bWVudEJ1dHRvbnNcIikuaGlkZSgpXG4gICAgJChcIiNzdW1tYXJ5IC5sb2FkaW5nXCIpLnNob3coKVxuICAgIGNyZWF0ZU9yZGVyIG9yZGVyXG5cbnJlZnJlc2hTdW1tYXJ5ID0gKCkgLT5cblxuICBvcmRlci5xdWFudGl0eSA9IHBhcnNlSW50KCQoXCIjcHJvZHVjdFNlbGVjdG9yIC5xdWFudGl0eVwiKS52YWwoKSlcbiAgJChcIiNzdW1tYXJ5IC5xdWFudGl0eVwiKS50ZXh0KG9yZGVyLnF1YW50aXR5KVxuICAkKFwiI3N1bW1hcnkgLnBpb3VwaW91RGVzY1wiKS50ZXh0KG9yZGVyLnBpb3VwaW91RGVzYylcbiAgJChcIiNzdW1tYXJ5IC53YXJyYW50eURlc2NcIikudGV4dChvcmRlci53YXJyYW50eURlc2MpXG4gICQoXCIjc3VtbWFyeSAuc2hpcHBpbmdEZXNjXCIpLnRleHQob3JkZXIuc2hpcHBpbmdEZXNjKVxuXG4gIG9yZGVyLnBpb3VwaW91VG90YWxUYXhFeGMgPSBvcmRlci5waW91cGlvdVRheEV4YyAqIG9yZGVyLnF1YW50aXR5XG4gIG9yZGVyLndhcnJhbnR5VG90YWxUYXhFeGMgPSBvcmRlci53YXJyYW50eVRheEV4YyAqIG9yZGVyLnF1YW50aXR5XG4gIG9yZGVyLmRpc2NvdW50VG90YWxUYXhFeGMgPSBvcmRlci5kaXNjb3VudFRheEV4YyAqIG9yZGVyLnF1YW50aXR5XG5cbiAgb3JkZXIudG90YWxUYXhFeGMgPSBvcmRlci5waW91cGlvdVRvdGFsVGF4RXhjIFxcXG4gICAgICAgICAgICAgICAgICAgICsgb3JkZXIud2FycmFudHlUb3RhbFRheEV4YyBcXFxuICAgICAgICAgICAgICAgICAgICArIG9yZGVyLmRpc2NvdW50VG90YWxUYXhFeGMgXFxcbiAgICAgICAgICAgICAgICAgICAgKyBvcmRlci5zaGlwcGluZ1RheEV4Y1xuICBvcmRlci50b3RhbFRheEV4YyA9IHBhcnNlRmxvYXQoYWNjb3VudGluZy50b0ZpeGVkKG9yZGVyLnRvdGFsVGF4RXhjLCAyKSlcbiAgb3JkZXIudG90YWxUYXggPSBwYXJzZUZsb2F0KGFjY291bnRpbmcudG9GaXhlZChvcmRlci50b3RhbFRheEV4YyAqIDAuMiwgMikpXG4gIG9yZGVyLnRvdGFsVGF4SW5jID0gb3JkZXIudG90YWxUYXhFeGMgKyBvcmRlci50b3RhbFRheFxuICBvcmRlci50b3RhbFRheEluYyA9IHBhcnNlRmxvYXQoYWNjb3VudGluZy50b0ZpeGVkKG9yZGVyLnRvdGFsVGF4SW5jLCAyKSlcblxuICB0YXhGYWN0b3IgPSAxXG4gIGlmIG9yZGVyLm5vVGF4ZXNcbiAgICBvcmRlci50b3RhbFRvUGF5ID0gb3JkZXIudG90YWxUYXhFeGNcbiAgICAkKFwiI3N1bW1hcnkgLnRheE1vZGVcIikudGV4dChMYW5nLnRheEV4YylcbiAgICAkKFwiI3N1bW1hcnkgLnR0Y1wiKS5oaWRlKClcbiAgICAkKFwiI3N1bW1hcnkgLmh0XCIpLnNob3coKVxuICAgICMkKFwiI3N1bW1hcnkgLmh0LnRvdGFsXCIpLmNzcyhcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICBlbHNlXG4gICAgb3JkZXIudG90YWxUb1BheSA9IG9yZGVyLnRvdGFsVGF4SW5jXG4gICAgJChcIiNzdW1tYXJ5IC50YXhNb2RlXCIpLnRleHQoTGFuZy50YXhJbmMpXG4gICAgIyQoXCIjc3VtbWFyeSAuaHQudG90YWxcIikuY3NzKFwiZm9udC13ZWlnaHRcIiwgXCJub3JtYWxcIilcbiAgICAkKFwiI3N1bW1hcnkgLnR0Y1wiKS5zaG93KClcbiAgICAkKFwiI3N1bW1hcnkgLmh0XCIpLmhpZGUoKVxuICAgIHRheEZhY3RvciA9IDEuMlxuXG4gIGlmIG9yZGVyLmRpc2NvdW50QWN0aXZlXG4gICAgJChcIiNzdW1tYXJ5IC5kaXNjb3VudFwiKS5zaG93KClcbiAgICAkKFwiI3N1bW1hcnkgLmRpc2NvdW50RGVzY1wiKS50ZXh0KG9yZGVyLmRpc2NvdW50RGVzYylcbiAgICAkKFwiI3N1bW1hcnkgLmRpc2NvdW50UHJpY2VcIikudGV4dChmbShvcmRlci5kaXNjb3VudFRheEV4Yyp0YXhGYWN0b3IsIDIpKVxuICAgICQoXCIjc3VtbWFyeSAuZGlzY291bnRUb3RhbFByaWNlXCIpLnRleHQoZm0ob3JkZXIuZGlzY291bnRUb3RhbFRheEV4Yyp0YXhGYWN0b3IsIDIpKVxuICBlbHNlXG4gICAgJChcIiNzdW1tYXJ5IC5kaXNjb3VudFwiKS5oaWRlKClcblxuICAkKFwiI3N1bW1hcnkgLnBpb3VwaW91UHJpY2VcIikudGV4dChmbShvcmRlci5waW91cGlvdVRheEV4Yyp0YXhGYWN0b3IsIDIpKVxuICAkKFwiI3N1bW1hcnkgLnBpb3VwaW91VG90YWxQcmljZVwiKS50ZXh0KGZtKG9yZGVyLnBpb3VwaW91VG90YWxUYXhFeGMqdGF4RmFjdG9yLCAyKSlcblxuICAkKFwiI3N1bW1hcnkgLndhcnJhbnR5UHJpY2VcIikudGV4dChmbShvcmRlci53YXJyYW50eVRheEV4Yyp0YXhGYWN0b3IsIDIpKVxuICAkKFwiI3N1bW1hcnkgLndhcnJhbnR5VG90YWxQcmljZVwiKS50ZXh0KGZtKG9yZGVyLndhcnJhbnR5VG90YWxUYXhFeGMqdGF4RmFjdG9yLCAyKSlcblxuICAkKFwiI3N1bW1hcnkgLnNoaXBwaW5nUHJpY2VcIikudGV4dChmbShvcmRlci5zaGlwcGluZ1RheEV4Yyp0YXhGYWN0b3IsIDIpKVxuXG4gICQoXCIjc3VtbWFyeSAudG90YWxUYXhJbmNcIikudGV4dChmbShvcmRlci50b3RhbFRheEluYywgMikpXG4gICQoXCIjc3VtbWFyeSAudG90YWxUYXhFeGNcIikudGV4dChmbShvcmRlci50b3RhbFRheEV4YywgMikpXG4gICMkKFwiI3N1bW1hcnkgLnRvdGFsVGF4XCIpLnRleHQoZm0ob3JkZXIudG90YWxUYXgsIDIpKVxuXG4gIFtcbiAgICBcImNvbnRhY3RfbmFtZVwiXG4gICAgXCJjb250YWN0X2VtYWlsXCJcbiAgICBcImNvbnRhY3RfcGhvbmVcIlxuICAgIFwiaW52b2ljZV9uYW1lXCJcbiAgICBcImludm9pY2VfY29tcGFueVwiXG4gICAgXCJpbnZvaWNlX2FkZHJlc3MxXCJcbiAgICBcImludm9pY2VfYWRkcmVzczJcIlxuICAgIFwiaW52b2ljZV9wb3N0Y29kZVwiXG4gICAgXCJpbnZvaWNlX2NpdHlcIlxuICAgIFwiaW52b2ljZV9jb3VudHJ5XCJcbiAgICBcInNoaXBwaW5nX25hbWVcIlxuICAgIFwic2hpcHBpbmdfY29tcGFueVwiXG4gICAgXCJzaGlwcGluZ19hZGRyZXNzMVwiXG4gICAgXCJzaGlwcGluZ19hZGRyZXNzMlwiXG4gICAgXCJzaGlwcGluZ19wb3N0Y29kZVwiXG4gICAgXCJzaGlwcGluZ19jaXR5XCJcbiAgICBcInNoaXBwaW5nX2NvdW50cnlcIlxuICAgIFwiaW52b2ljZV92YXRcIlxuICAgIFwidmF0TnVtYmVyQ29tcGFueVwiXG4gIF0uZm9yRWFjaCAoZmllbGQpIC0+XG4gICAgJChcIiNzdW1tYXJ5IC5cIiArIGZpZWxkKS50ZXh0KG9yZGVyW2ZpZWxkXSlcblxuICBpZiBvcmRlci52YXROdW1iZXJWYWxpZFxuICAgICQoXCIjc3VtbWFyeSAudmF0TnVtYmVyXCIpLnNob3coKVxuICBlbHNlXG4gICAgJChcIiNzdW1tYXJ5IC52YXROdW1iZXJcIikuaGlkZSgpXG5cblxuIyA9PT09PSBjYXJkUGF5bWVudCA9PT09PT09PT1cblxucmVmcmVzaENhcmRQYXltZW50ID0gKCkgLT5cbiAgJChcIiNjYXJkUGF5bWVudCAuc3VibWl0XCIpLnRleHQoTGFuZy5wYXkgKyBcIiBcIiArIGZtKG9yZGVyLnRvdGFsVG9QYXksIDIpKVxuXG5cbiQoXCIjY2FyZFBheW1lbnQgLnN1Ym1pdFwiKS5jbGljayAoKSAtPlxuXG4gIGNhcmQgPSB7XG4gICAgbnVtYmVyOiAkKFwiI2NhcmRQYXltZW50IC5udW1iZXJcIikudmFsKClcbiAgICBleHBfbW9udGg6ICQoXCIjY2FyZFBheW1lbnQgLmV4cF9tb250aFwiKS52YWwoKVxuICAgIGV4cF95ZWFyOiAkKFwiI2NhcmRQYXltZW50IC5leHBfeWVhclwiKS52YWwoKVxuICAgIGN2YzogJChcIiNjYXJkUGF5bWVudCAuY3ZjXCIpLnZhbCgpXG4gIH1cblxuICB1bmxlc3MgU3RyaXBlLmNhcmQudmFsaWRhdGVDYXJkTnVtYmVyKGNhcmQubnVtYmVyKVxuICAgICQoXCIjY2FyZFBheW1lbnQgLm51bWJlclwiKS5wYXJlbnQoKS5hZGRDbGFzcyhcImhhcy1lcnJvclwiKVxuICAgIGFsZXJ0KFwiVmV1aWxsZXogdsOpcmlmaWVyIGxlcyBpbmZvcm1hdGlvbnNcIilcbiAgICByZXR1cm5cblxuICB1bmxlc3MgU3RyaXBlLmNhcmQudmFsaWRhdGVFeHBpcnkoY2FyZC5leHBfbW9udGgsIGNhcmQuZXhwX3llYXIpXG4gICAgJChcIiNjYXJkUGF5bWVudCAuZXhwX21vbnRoXCIpLnBhcmVudCgpLmFkZENsYXNzKFwiaGFzLWVycm9yXCIpXG4gICAgYWxlcnQoXCJWZXVpbGxleiB2w6lyaWZpZXIgbGVzIGluZm9ybWF0aW9uc1wiKVxuICAgIHJldHVyblxuXG4gIHVubGVzcyBTdHJpcGUuY2FyZC52YWxpZGF0ZUNWQyhjYXJkLmN2YylcbiAgICAkKFwiI2NhcmRQYXltZW50IC5jdmNcIikucGFyZW50KCkuYWRkQ2xhc3MoXCJoYXMtZXJyb3JcIilcbiAgICBhbGVydChcIlZldWlsbGV6IHbDqXJpZmllciBsZXMgaW5mb3JtYXRpb25zXCIpXG4gICAgcmV0dXJuXG5cbiAgJChcIiNjYXJkUGF5bWVudCAuc3VibWl0XCIpLmhpZGUoKVxuICAkKFwiI2NhcmRQYXltZW50IC5sb2FkaW5nXCIpLnNob3coKVxuXG4gIFN0cmlwZS5jYXJkLmNyZWF0ZVRva2VuIGNhcmQsIChzdGF0dXMsIHJlc3BvbnNlKSAtPlxuICAgIGlmIHJlc3BvbnNlLmVycm9yXG4gICAgICBpZiByZXNwb25zZS5lcnJvci5jb2RlXG4gICAgICAgIGFsZXJ0KExhbmcuc3RyaXBlW3Jlc3BvbnNlLmVycm9yLmNvZGVdKVxuICAgICAgZWxzZVxuICAgICAgICBhbGVydChcIlVuZSBlcnJldXIgcydlc3QgcHJvZHVpdGUuIFJlc3NheWV6XCIpXG4gICAgICAkKFwiI2NhcmRQYXltZW50IC5zdWJtaXRcIikuc2hvdygpXG4gICAgICAkKFwiI2NhcmRQYXltZW50IC5sb2FkaW5nXCIpLmhpZGUoKVxuICAgIGVsc2VcbiAgICAgIGNhcmQgPSBudWxsXG4gICAgICAkKFwiI2NhcmRQYXltZW50IGlucHV0XCIpLnZhbChcIlwiKVxuICAgICAgb3JkZXIuc3RyaXBlX3Rva2VuID0gcmVzcG9uc2UuaWRcbiAgICAgIGNyZWF0ZU9yZGVyIG9yZGVyXG5cbiMgPT09PT0gI3RoYW5rcyA9PT09PT09PT1cbnJlZnJlc2hUaGFua3MgPSAoKSAtPlxuICAkKFwiI3RoYW5rcyAub3JkZXJJZFwiKS50ZXh0KG9yZGVyLmlkKVxuICAkKFwiI3RoYW5rcyAuZW1haWxcIikudGV4dChvcmRlci5jb250YWN0X2VtYWlsKVxuXG4gICQoXCIjdGhhbmtzIC5hbW91bnRcIikudGV4dChmbShvcmRlci50b3RhbFRvUGF5LCAyKSlcblxuICB1cmxFbmRQb2ludCA9IFwiL3F1b3RhdGlvblwiXG4gIGJ1dHRvblRleHQgPSBMYW5nLnByaW50UXVvdGF0aW9uXG5cbiAgaWYgb3JkZXIucGF5bWVudE1ldGhvZCA9PSBcImNhcmRcIlxuICAgICQoXCIjdGhhbmtzIC5jYXJkXCIpLnNob3coKVxuICAgIGJ1dHRvblRleHQgPSBMYW5nLnByaW50SW52b2ljZVxuICAgIHVybEVuZFBvaW50ID0gXCIvaW52b2ljZVwiXG4gIGVsc2UgaWYgb3JkZXIucGF5bWVudE1ldGhvZCA9PSBcImNoZWNrXCJcbiAgICAkKFwiI3RoYW5rcyAuY2hlY2tcIikuc2hvdygpXG4gIGVsc2UgaWYgb3JkZXIucGF5bWVudE1ldGhvZCA9PSBcInRyYW5zZmVyXCJcbiAgICAkKFwiI3RoYW5rcyAudHJhbnNmZXJcIikuc2hvdygpXG5cblxuICB1cmwgPSBcImh0dHBzOi8vcGlvdXBpb3UuZnIvXCIgKyBMYW5nLmxhbmcgKyB1cmxFbmRQb2ludCArIFxcXG4gICAgICAgICAgXCI/b3JkZXI9XCIgKyBvcmRlci5pZCArIFxcXG4gICAgICAgICAgXCImZW1haWw9XCIgKyBvcmRlci5jb250YWN0X2VtYWlsXG5cbiAgJChcIiN0aGFua3MgLmludm9pY2VCdXR0b25cIikuYXR0cihcImhyZWZcIiwgdXJsKS50ZXh0KGJ1dHRvblRleHQpXG5cbiMgPT0gbmV3c2xldHRlciA9PT09PT1cblxuJChcIi5uZXdzbGV0dGVyIC5zdWJtaXRcIikuY2xpY2sgKCkgLT5cbiAgZW1haWwgPSAkKFwiLm5ld3NsZXR0ZXIgLmVtYWlsXCIpLnZhbCgpXG4gIGlmIGVtYWlsID09IFwiXCJcbiAgICBhbGVydCBMYW5nLnBsZWFzZUZpbGxUaGVGb3JtXG4gICAgcmV0dXJuXG5cbiAgJChcIi5uZXdzbGV0dGVyIC5zdWJtaXRcIikuaGlkZSgpXG4gICQoXCIubmV3c2xldHRlciAubG9hZGluZ1wiKS5zaG93KClcbiAgZGF0YSA9IHtcbiAgICBlbWFpbDogZW1haWxcbiAgICBsYW5nOiBMYW5nLmxhbmdcbiAgfVxuICAkLnBvc3QgXCJodHRwczovL2FwaS5waW91cGlvdS5mci92MS9zaG9wL25ld3NsZXR0ZXJcIiwgZGF0YSwgKChyZXNwb25zZSwgdGV4dFN0YXR1cykgLT5cbiAgICBjb25zb2xlLmxvZyByZXNwb25zZVxuICAgIGlmIHJlc3BvbnNlLmVycm9yXG4gICAgICBhbGVydCBMYW5nLmVycm9yUmV0cnlcbiAgICBlbHNlXG4gICAgICBhbGVydCBMYW5nLnN1Y2Nlc3NOZXdzbGV0dGVyK2VtYWlsXG4gICAgICAkKFwiLm5ld3NsZXR0ZXIgLmVtYWlsXCIpLnZhbChcIlwiKVxuICAgICQoXCIuc3VibWl0XCIpLnNob3coKVxuICAgICQoXCIubG9hZGluZ1wiKS5oaWRlKClcbiAgKSwgXCJqc29uXCJcbiAgLmVycm9yICgpIC0+XG4gICAgYWxlcnQgTGFuZy5lcnJvclJldHJ5XG4gICAgJChcIi5zdWJtaXRcIikuc2hvdygpXG4gICAgJChcIi5sb2FkaW5nXCIpLmhpZGUoKVxuIl19
