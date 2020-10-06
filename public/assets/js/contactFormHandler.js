/*deals with contact us form */

$('#contact-us').submit(function (e) {

    e.preventDefault();

    //getting values from form field
    var formData = {
        'name': $('#contact-us-name').val(),
        'email': $('#contact-us-email').val(),
        'subject': $('#contact-us-subject').val()||"",
        'message': $('#contact-us-message').val()
    };

    //making ajax request
    $.ajax({
        type: 'POST',
        url: 'YOUR_FORMSPREE_FORM_ENDPOINT_HERE',
        data: formData,
        dataType: 'json',
        encode: true,
        success:function(data){
            alert('Details submitted successfully');

            //on successful submission resetting the form
            $('#contact-us').trigger('reset');

        },
        error: function(data){
            alert('Oops! error encounted while submitting details');
        }
    })

});